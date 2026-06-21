from rest_framework.pagination import PageNumberPagination

ALLOWED_PAGE_SIZES = {10, 20, 50, 100}


class OptionalPageNumberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if "page" not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)

    def get_page_size(self, request):
        if self.page_size_query_param:
            try:
                size = int(request.query_params[self.page_size_query_param])
                if size in ALLOWED_PAGE_SIZES:
                    return size
            except (KeyError, TypeError, ValueError):
                pass
        return self.page_size
