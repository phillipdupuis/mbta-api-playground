from django.apps import AppConfig


class ParamsConfig(AppConfig):
    name = 'params'

    def ready(self):
        from . import db_init
        db_init.main()
