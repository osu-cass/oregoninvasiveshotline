from datetime import datetime, timezone

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.urls import reverse
from django.test import TestCase

from model_bakery.baker import make

from oregoninvasiveshotline.counties.models import County
from oregoninvasiveshotline.species.models import Category, Species
from oregoninvasiveshotline.utils.test.user import UserMixin

from ..models import Report
from .shared import ORIGIN, SuppressPostSaveMixin


class ReportListView(TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def test_get(self):
        reports = make(Report, _quantity=3, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertIn(reports[0].title, response.content.decode())


class ReportListStats(SuppressPostSaveMixin, TestCase, UserMixin):

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )

    def _backdate(self, report: Report, year: int) -> None:
        """Set created_on to mid-year, bypassing auto_now_add."""
        Report.objects.filter(pk=report.pk).update(
            created_on=datetime(year, 6, 15, 12, tzinfo=timezone.utc)
        )

    def test_stats_grouped_by_year_with_confirmed_counts(self):
        species = make(Species)
        confirmed = make(Report, point=ORIGIN, actual_species=species)
        unconfirmed = make(Report, point=ORIGIN)
        older = make(Report, point=ORIGIN)
        self._backdate(confirmed, 2024)
        self._backdate(unconfirmed, 2024)
        self._backdate(older, 2023)

        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["report_stats"], [
            {"year": 2023, "total": 1, "confirmed": 0},
            {"year": 2024, "total": 2, "confirmed": 1},
        ])

    def test_map_is_the_default_result_view(self):
        make(Report, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-list"))

        self.assertEqual(response.context["result_view"], "map")
        content = response.content.decode()
        self.assertIn('class="nav-link active" id="list-map-tab"', content)
        self.assertIn('aria-controls="list-map-pane" aria-selected="true"', content)
        self.assertIn('class="tab-pane active" id="list-map-pane"', content)
        self.assertNotIn('id="result-view-input"', content)

    def test_stats_query_selects_and_preserves_stats_view(self):
        make(Report, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-list"), {"view": "stats"})

        self.assertEqual(response.context["result_view"], "stats")
        content = response.content.decode()
        self.assertIn('class="nav-link active" id="list-stats-tab"', content)
        self.assertIn('aria-controls="list-stats-pane" aria-selected="true"', content)
        self.assertIn('class="tab-pane active" id="list-stats-pane"', content)
        self.assertIn(
            'id="result-view-input" type="hidden" name="view" value="stats"',
            content,
        )

    def test_invalid_result_view_defaults_to_map(self):
        make(Report, point=ORIGIN)
        self.client.login(email=self.user.email, password="foo")

        response = self.client.get(reverse("reports-list"), {"view": "unknown"})

        self.assertEqual(response.context["result_view"], "map")
        content = response.content.decode()
        self.assertIn('class="nav-link active" id="list-map-tab"', content)
        self.assertNotIn('id="result-view-input"', content)

    def test_map_and_stats_hidden_when_search_has_no_matches(self):
        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(
            reverse("reports-list"),
            {"q": "no-match", "view": "stats"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["report_stats"], [])
        self.assertEqual(response.context["result_view"], "stats")
        content = response.content.decode()
        self.assertNotIn('id="list-map-tab"', content)
        self.assertNotIn('id="list-stats-tab"', content)
        self.assertNotIn('id="map-canvas"', content)
        self.assertNotIn('id="stats-chart"', content)
        self.assertNotIn('id="stats-pie"', content)
        self.assertIn('id="result-view-input"', content)
        self.assertIn("No matching reports found.", content)

    def test_stats_for_anonymous_only_count_public_reports(self):
        public = make(Report, point=ORIGIN, is_public=True)
        private = make(Report, point=ORIGIN, is_public=False)
        self._backdate(public, 2024)
        self._backdate(private, 2024)

        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["report_stats"], [
            {"year": 2024, "total": 1, "confirmed": 0},
        ])

    def test_stats_unaffected_by_pagination(self):
        reports = make(Report, _quantity=30, point=ORIGIN)
        for report in reports:
            self._backdate(report, 2024)

        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"), {"page": 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["report_stats"], [
            {"year": 2024, "total": 30, "confirmed": 0},
        ])

    def test_stats_fill_missing_years_with_zeros(self):
        newer = make(Report, point=ORIGIN)
        older = make(Report, point=ORIGIN)
        self._backdate(newer, 2025)
        self._backdate(older, 2022)

        self.client.login(email=self.user.email, password="foo")
        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["report_stats"], [
            {"year": 2022, "total": 1, "confirmed": 0},
            {"year": 2023, "total": 0, "confirmed": 0},
            {"year": 2024, "total": 0, "confirmed": 0},
            {"year": 2025, "total": 1, "confirmed": 0},
        ])


class ReportListCategoryStats(SuppressPostSaveMixin, TestCase, UserMixin):
    """Category breakdown for the stats summary tab."""

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        self.client.login(email=self.user.email, password="foo")

    def test_grouped_by_effective_category(self):
        plants = make(Category, name="Land Plants")
        insects = make(Category, name="Insects and Spiders")
        insect_species = make(Species, category=insects)
        # A confirmed report counts under the actual species' category, not the reported one.
        make(Report, point=ORIGIN, reported_category=plants, actual_species=insect_species)
        make(Report, point=ORIGIN, reported_category=plants, _quantity=2)

        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["report_category_stats"], [
            {"category_name": "Land Plants", "count": 2},
            {"category_name": "Insects and Spiders", "count": 1},
        ])

    def test_empty_when_no_matches(self):
        response = self.client.get(reverse("reports-list"), {"q": "no-match"})
        self.assertEqual(response.context["report_category_stats"], [])


class ReportListSummary(SuppressPostSaveMixin, TestCase, UserMixin):
    """Facts for the stats summary tab."""

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        self.client.login(email=self.user.email, password="foo")

    def test_summary_values(self):
        """The summary includes the top category name and count."""
        plants = make(Category, name="Land Plants")
        species = make(Species, category=plants)
        square = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        county = make(County, the_geom=MultiPolygon(square))
        make(
            Report,
            point=ORIGIN,
            reported_category=plants,
            actual_species=species,
            county=county,
        )
        make(Report, point=ORIGIN, reported_category=plants, county=county)
        make(Report, point=ORIGIN, reported_category=plants, county=None)

        response = self.client.get(reverse("reports-list"))
        self.assertEqual(response.context["report_summary"], {
            "total": 3,
            "confirmed": 1,
            "top_category": "Land Plants",
            "top_category_count": 3,
            "county_count": 1,
        })

    def test_summary_empty_search(self):
        """An empty result set has no top category or category count."""
        response = self.client.get(reverse("reports-list"), {"q": "no-match"})
        self.assertEqual(response.context["report_summary"], {
            "total": 0,
            "confirmed": 0,
            "top_category": None,
            "top_category_count": None,
            "county_count": 0,
        })

    def test_stats_pane_omits_single_category_chart(self):
        """The stats pane omits a category chart with only one slice."""
        plants = make(Category, name="Land Plants")
        species = make(Species, category=plants)
        square = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        county = make(County, the_geom=MultiPolygon(square))
        make(Report, point=ORIGIN, reported_category=plants, actual_species=species, county=county)
        make(Report, point=ORIGIN, reported_category=plants, county=county)
        make(Report, point=ORIGIN, reported_category=plants, county=None)

        response = self.client.get(reverse("reports-list"))
        content = response.content.decode()
        self.assertIn(
            '<ul class="stats-summary" aria-label="Report summary">',
            content,
        )
        self.assertIn(
            '<li class="stats-summary-item"><strong>3</strong> '
            'matching reports</li>',
            content,
        )
        self.assertIn(
            '<li class="stats-summary-item"><strong>1</strong> of '
            '<strong>3</strong> confirmed</li>',
            content,
        )
        self.assertIn(
            '<li class="stats-summary-item"><strong>1</strong> '
            'county represented</li>',
            content,
        )
        self.assertIn(
            '<li class="stats-summary-item">Top category: '
            '<strong>Land Plants</strong> (<strong>3</strong> reports)</li>',
            content,
        )
        self.assertNotIn("stats-fact", content)
        self.assertIn('id="stats-chart"', content)
        self.assertNotIn('id="stats-pie"', content)
        self.assertIn("Reports by year", content)
        self.assertNotIn("Reports by category", content)
        self.assertNotIn("all-time", content)

    def test_stats_pane_renders_multiple_category_chart(self):
        """The stats pane renders the category chart for multiple slices."""
        plants = make(Category, name="Land Plants")
        insects = make(Category, name="Insects and Spiders")
        make(Report, point=ORIGIN, reported_category=plants)
        make(Report, point=ORIGIN, reported_category=insects)

        response = self.client.get(reverse("reports-list"))
        content = response.content.decode()

        self.assertIn('id="stats-chart"', content)
        self.assertIn('id="stats-pie"', content)
        self.assertIn("Reports by category", content)

    def test_stats_pane_renders_unavailable_category(self):
        """The summary explains when no named top category is available."""
        unnamed_category = make(Category, name="")
        make(Report, point=ORIGIN, reported_category=unnamed_category)

        response = self.client.get(reverse("reports-list"))

        self.assertIn(
            '<li class="stats-summary-item">Top category unavailable</li>',
            response.content.decode(),
        )


class ReportListResultCount(SuppressPostSaveMixin, TestCase, UserMixin):
    """The result count under the search box renders only for active filters."""

    def setUp(self):
        self.user = self.create_user(
            username="foo@example.com",
            password="foo",
            is_active=True,
            is_staff=False
        )
        self.client.login(email=self.user.email, password="foo")

    def _make_county(self) -> County:
        square = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        return make(County, the_geom=MultiPolygon(square))

    def test_hidden_without_filters(self):
        make(Report, _quantity=3, point=ORIGIN)
        response = self.client.get(reverse("reports-list"))
        self.assertNotIn("3 results", response.content.decode())

    def test_hidden_when_only_default_valued_filters_are_set(self):
        make(Report, _quantity=3, point=ORIGIN)
        response = self.client.get(
            reverse("reports-list"), {"is_archived": "notarchived"})
        self.assertNotIn("3 results", response.content.decode())

    def test_shown_for_archived_filter(self):
        """An explicit archived selection displays its filtered result count."""
        make(Report, point=ORIGIN, is_archived=True)
        make(Report, point=ORIGIN, is_archived=False)

        response = self.client.get(
            reverse("reports-list"), {"is_archived": "archived"})

        self.assertIn("1 result", response.content.decode())

    def test_shown_for_keyword_search(self):
        make(Report, _quantity=3, point=ORIGIN)
        response = self.client.get(reverse("reports-list"), {"q": "no-match"})
        self.assertIn("0 results", response.content.decode())

    def test_shown_for_county_filter(self):
        county = self._make_county()
        make(Report, point=ORIGIN, county=county)
        make(Report, _quantity=2, point=ORIGIN, county=None)
        response = self.client.get(
            reverse("reports-list"), {"counties": str(county.pk)})
        self.assertIn("1 result", response.content.decode())

    def test_shown_for_category_filter(self):
        category = make(Category)
        make(Report, point=ORIGIN, reported_category=category)
        make(Report, _quantity=2, point=ORIGIN)
        response = self.client.get(
            reverse("reports-list"), {"categories": str(category.pk)})
        self.assertIn("1 result", response.content.decode())
