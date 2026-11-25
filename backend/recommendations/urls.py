"""
URL Configuration for Recommendations App.
"""
from django.urls import path
from .views import (
    RecommendationView,
    OccasionsListView,
    PreferencesMetadataView,
)

urlpatterns = [
    # POST: Generate personalized recommendations
    path("", RecommendationView.as_view(), name="recommendations_generate"),

    # GET: Retrieve list of supported occasions
    path("occasions/", OccasionsListView.as_view(), name="recommendations_occasions"),

    # GET: Retrieve preference options (flower types, colours, styles, recipients)
    path("preferences/", PreferencesMetadataView.as_view(), name="recommendations_preferences"),
]
