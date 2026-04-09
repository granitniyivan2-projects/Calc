import os
import importlib

PLUGIN_FOLDER = "plugins"


def load_plugins():
    plugins = []

    for file in os.listdir(PLUGIN_FOLDER):
        if file.endswith(".py") and file != "__init__.py":

            module_name = file[:-3]
            module_path = f"{PLUGIN_FOLDER}.{module_name}"

            module = importlib.import_module(module_path)

            if hasattr(module, "register"):
                plugins.append(module.register())

    return plugins