from django import template

register = template.Library()


@register.simple_tag
def visible_page_nums(paginator, page_obj):
    """ Returns a list of the page numbers which should be shown as
        discrete options in the pagination display, based on the current
        page number and total number of pages."""
    curr_page = page_obj.number
    all_pages = list(paginator.page_range)
    if curr_page == all_pages[0]:
        return all_pages[:3]
    elif curr_page == all_pages[-1]:
        return all_pages[-3:]
    else:
        idx = all_pages.index(curr_page)
        return all_pages[(idx - 1):(idx + 2)]
