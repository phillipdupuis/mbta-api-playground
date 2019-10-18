from django.shortcuts import redirect, render


def home(request):
    return redirect('about')


def about(request):
    return render(request, 'core/about.html', context={})
