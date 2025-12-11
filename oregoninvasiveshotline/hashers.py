import hashlib

from django.contrib.auth.hashers import BasePasswordHasher
from django.utils.crypto import constant_time_compare


class RubyPasswordHasher(BasePasswordHasher):
    """
    A password hasher that re-hashes the passwords from the old site so they can be used here.
    Encryption (old): Sha256
    """
    algorithm = "RubyPasswordHasher"

    def verify(self, password, encoded):
        """
        Actually, I think the only thing we have to do here is check that
        encoded_2 == encrypted
        instead of password == encrypted
        """
        algorithm, _, _, hash = encoded.split('$', 3)
        assert algorithm == self.algorithm
        # here's the extra step
        hashed = hashlib.sha256(password.encode("utf-8")).hexdigest()
        return constant_time_compare(hash, hashed)
