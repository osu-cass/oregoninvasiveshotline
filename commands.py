import os.path
import pathlib
import time
from typing import TYPE_CHECKING

from emcee.runner.config import YAMLCommandConfiguration
from emcee.runner import command, configs, config
from emcee.runner.commands import remote
from emcee.runner.utils import confirm
from emcee.app.config import YAMLAppConfiguration
from emcee import printer

from emcee.commands.files import copy_file

from emcee.provision.base import provision_host
from emcee.provision.docker import provision_docker, authenticate_ghcr
from emcee.provision.secrets import provision_secret

from emcee.deploy import deployer, docker, DeploymentCheckError

from emcee.backends.aws.provision.volumes import (provision_volume,
                                                  provision_swapfile)

if TYPE_CHECKING:
    from typing import Type

configs.load(YAMLCommandConfiguration)


@command
def provision(createdb=False):
    # Configure host properties and prepare host platforms
    provision_host()

    # Provision application services
    provision_docker()

    # Provision service volume
    printer.header("Initializing service volume...")
    provision_volume(mount_point='/vol/store', filesystem='xfs')
    remote(['mkdir', '-p', '/vol/store/services'], sudo=True)

    for service in [
        'postgresql/data',
        'postgresql/archive',
        'postgresql/run',
        'rabbitmq',
    ]:
        service_path = os.path.join('/vol/store/services', service)
        result = remote(['mkdir', '-p', service_path], raise_on_error=False, sudo=True)
        if result.succeeded:
            owner = '{}:{}'.format(config.iam.user, config.iam.user)
            remote(['chown', '-R', owner, service_path], sudo=True)

    # Initialize swapfile on EBS volume
    provision_swapfile(1024, path='/vol/store')

    # Create persistent asset directory on EBS mount
    printer.header("Creating media directory on EBS volume...")
    remote(('mkdir', '-p', '/vol/store/media'), sudo=True)

    # Create link for log storage path
    printer.header("Creating log path...")
    remote(('test', '-h', config.remote.path.log_dir, '||',
            'mkdir', '-p', config.remote.path.log_dir))

    # Create link for static asset path
    printer.header("Creating static asset path...")
    remote(('test', '-h', config.remote.path.static, '||',
            'mkdir', '-p', config.remote.path.static))

    # Create link for stored media path
    remote(('test', '-h', config.remote.path.media, '||',
            'ln', '-sf', '/vol/store/media', config.remote.path.media))

    # Synchronize icons and assorted media assets
    if confirm("Synchronize media from archive?"):
        archive_path = pathlib.Path(input("Path to archive: ").strip())
        copy_file(archive_path, config.remote.path.media, sudo=True)
        remote(('tar', 'xvf', archive_path.name, '&&',
                'rm', archive_path.name),
               cd=config.remote.path.media,
               sudo=True
        )

    # Set the correct permissions on generated assets
    printer.header("Setting permissions on media assets...")
    owner = '{}:{}'.format(config.iam.user, config.services.nginx.group)
    remote(('chown', '-h', owner, config.remote.path.media), sudo=True)
    remote(('chown', '-R', owner, '/vol/store/media'), sudo=True)
    remote(('chmod', 'g+X', '/vol/store/media'), sudo=True)

    # Provision application secrets
    db_password = input("Enter the PostgreSQL superuser password: ")
    provision_secret('DBPassword', db_password)
    api_key = input('Enter the Google API key for this project/environment: ')
    provision_secret('GOOGLE_API_KEY', api_key)

    # Authenticates appropriate user on remote host for
    # interaction with the GitHub Container Registry.
    authenticate_ghcr()


@command
def maintenance_mode():
    printer.info("Activating application maintenance mode...")
    remote_processor = InvasivesRemoteProcessor(options=None)

    # remove user-facing services from stack
    if remote_processor.remove_stack_services(INVASIVES_SERVICES['frontend']):
        # wait a predetermined about of time for the
        # task queues to be emptied of work
        printer.info("Waiting 60s for task queue to empty...")
        time.sleep(60)

    # remove the remaining services from stack
    remote_processor.remove_stack_services(INVASIVES_SERVICES['backend'])


class InvasivesLocalProcessor(docker.LocalProcessor):
    include_app = True
    include_nginx = True

class InvasivesRemoteProcessor(docker.RemoteProcessor):
    """
    TBD
    """

    def is_stack_active(self) -> bool:
        return super().is_stack_active()

    def deploy_stack(self, stackfile: str | None = None) -> None:
        return super().deploy_stack(stackfile)

    def scale_stack_service(self, service: str, scale: int, wait: bool = False) -> bool:
        return super().scale_stack_service(service, scale, wait)

    def pull_stack_images(self) -> None:
        return super().pull_stack_images()

# The following section *appears* to be unused, and is commented as it causes lint errors
@deployer()
class InvasivesDeployer(docker.Deployer):
    local_processor_cls: 'Type[InvasivesLocalProcessor]' = InvasivesLocalProcessor
    remote_processor_cls: 'Type[InvasivesRemoteProcessor]' = InvasivesRemoteProcessor
    remote_processor: "InvasivesRemoteProcessor"
    app_config_cls: 'Type[YAMLAppConfiguration]' = YAMLAppConfiguration

    def bootstrap_application(self):
        if not self.remote_processor.is_stack_active():
            raise DeploymentCheckError("Stack is not active in remote environment.")

        # enable maintenance mode before bootstrapping application
        maintenance_mode()

        # verify that the database has been initialized
        stat_cmd = ['stat', '/vol/store/services/postgresql/data']
        result = remote(stat_cmd, raise_on_error=False, run_as=config.iam.user)
        if not result.succeeded:
            raise DeploymentCheckError("PostgreSQL database must be initialized. Exiting.")

        printer.info("Bootstrapping application...")
        bootstrap_stackfile = '{}-bootstrap.yml'.format(config.env)
        self.remote_processor.deploy_stack(stackfile=bootstrap_stackfile)

        # force bootstrap service to run
        self.remote_processor.scale_stack_service('bootstrap', 1, wait=True)
        self.remote_processor.scale_stack_service('bootstrap', 0)

        # force update check for all service images not uniquely tagged/versioned
        self.remote_processor.pull_stack_images()


INVASIVES_SERVICES = {}
INVASIVES_SERVICES['frontend'] = [
    'scheduler', 'app'
]
INVASIVES_SERVICES['backend'] = [
    'celery'
]
