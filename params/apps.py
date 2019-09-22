from django.apps import AppConfig
from django.db.migrations.executor import MigrationExecutor
from django.db import connections, DEFAULT_DB_ALIAS


class ParamsConfig(AppConfig):
    name = 'params'

    def ready(self):
        if unapplied_migrations_exist():
            print('Can not initialize the DataBase until all migrations have been applied')
        else:
            from . import db_init
            db_init.main()


def unapplied_migrations_exist() -> bool:
    """
    Check if there are database migrations that have not been applied yet.
    If so, we can't run the init because it may be dependent on those migrations.
    """
    connection = connections[DEFAULT_DB_ALIAS]
    connection.prepare_database()
    executor = MigrationExecutor(connection)
    targets = executor.loader.graph.leaf_nodes()
    if executor.migration_plan(targets):
        return True
    else:
        return False
