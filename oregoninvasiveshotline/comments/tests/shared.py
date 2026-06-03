from django.core import mail
from django.contrib.gis.geos import Point
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from django.urls import reverse

from model_bakery.baker import make

from oregoninvasiveshotline.utils.test.user import UserMixin
from oregoninvasiveshotline.images.models import Image
from oregoninvasiveshotline.reports.models import Invite, Report

from ..forms import CommentForm
from ..models import Comment


ORIGIN = Point(0, 0)
