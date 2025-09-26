from typing import Type

from .strategy import INIJSONStrategy

class Base(object):

    def __init__(self, file_name: str, section=None, registry=None, strategy_type: Type[INIJSONStrategy] | None = None):
        if strategy_type:
            strategy = strategy_type()
            file_name, section = strategy.parse_file_name_and_section(file_name, section)
            self.file_name = file_name
            self.section = section
            # Registry of local settings with a value in the settings file
            self.registry = {} if registry is None else registry
            self.strategy_type = strategy_type
            self.strategy = strategy
