import requests
import pandas as pd


class Results:
    def __init__(self, response: requests.Response):
        self.response = response
        if response.ok:
            self.df = create_DataFrame(response)
            reduce_DataFrame_memory_usage(self.df)
            self.columns_shown = self.df.columns.tolist()
            self.error = None
            self.error_details = None
            self.response_size_bytes = len(response.content)
        else:
            self.df = None
            self.columns_shown = None
            self.error = f'{response.status_code} {response.reason}'
            self.error_details = get_error_details(response)

    @property
    def data_frame(self) -> pd.DataFrame:
        return self.df

    @property
    def data_frame_rows(self):
        class data_frame_cell:
            def __init__(self, row, col, df):
                self.row_id = row
                self.col_id = col
                self.value = df.at[row, col]

        class data_frame_row:
            def __init__(self, row, df):
                self.id = row
                self.cells = [data_frame_cell(row, col, df) for col in df.columns]

        return [data_frame_row(row, self.df) for row in self.df.index[:100]]

    # @property
    # def data_frame_as_html(self):
    #     return convert_DataFrame_to_html_table(self.df[self.columns_shown])


def create_DataFrame(response: requests.Response) -> pd.DataFrame:
    """ Creates a pandas DataFrame from the MBTA API response """
    main_df = pd.DataFrame(response.json()['data'])
    assert main_df['type'].nunique() == 1
    main_type = main_df['type'].unique()[0]
    main_df = clean_DataFrame(main_df)

    if 'included' in response.json():
        main_df = prefix_DataFrame_columns(main_df, f'{main_type}_')

        for inc_type, inc_df in pd.DataFrame(response.json()['included']).groupby('type'):
            inc_df = clean_DataFrame(inc_df)
            inc_df = prefix_DataFrame_columns(inc_df, f'{inc_type}_')

            main_id_column = f'{main_type}_{inc_type}'
            inc_id_column = f'{inc_type}_id'

            main_df = main_df.merge(inc_df, how='left', left_on=main_id_column, right_on=inc_id_column)
            main_df.drop(columns=[main_id_column], inplace=True)

    return main_df


def clean_DataFrame(df: pd.DataFrame) -> pd.DataFrame:
    """ Expand some columns, drop others, ... """
    def get_data_id(x):
        if isinstance(x, pd.Series):
            return x.apply(get_data_id)
        else:
            try:
                return x['data']['id']
            except (TypeError, KeyError):
                return None

    attributes = df['attributes'].apply(pd.Series)
    relationships = df['relationships'].apply(pd.Series).apply(get_data_id)
    return df.drop(columns=['links', 'type', 'attributes', 'relationships']).join(attributes).join(relationships)


def prefix_DataFrame_columns(df: pd.DataFrame, prefix: str) -> pd.DataFrame:
    """ Renames columns, adding a prefix """
    def rename_function(column_name):
        return f'{prefix}{column_name}'

    return df.rename(rename_function, axis='columns')


def reduce_DataFrame_memory_usage(df: pd.DataFrame) -> None:
    """ Reduce memory usage by converting columns to categorical type """
    for column in df.columns:
        try:
            if df[column].nunique() < (df[column].size // 5):
                df[column] = df[column].astype('category')
        except TypeError:
            pass


def get_error_details(response: requests.Response) -> str:
    """ Returns a string with details describing the request error(s) """
    try:
        details = [error['detail'] for error in response.json()['errors']]
        return '\n'.join(details)
    except KeyError:
        return ''

