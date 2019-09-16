from django.apps import AppConfig


class ParamsConfig(AppConfig):
    name = 'params'

    def ready(self):
        pass
#         from . import db_init
#         db_init.main()
