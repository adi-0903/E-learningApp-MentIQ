from unittest.mock import patch
from django.test import TestCase
from apps.emails.tasks import fetch_inbox_task


class FetchInboxTaskTests(TestCase):
    @patch("apps.emails.imap_reader.fetch_inbox_emails")
    def test_fetch_inbox_task_success(self, mock_fetch):
        mock_fetch.return_value = {"fetched": 10, "new": 3, "errors": []}

        result = fetch_inbox_task()

        mock_fetch.assert_called_once_with(limit=50)
        self.assertEqual(result, {"fetched": 10, "new": 3, "errors": []})

    @patch("apps.emails.imap_reader.fetch_inbox_emails")
    def test_fetch_inbox_task_exception(self, mock_fetch):
        mock_fetch.side_effect = Exception("IMAP connection failed")

        result = fetch_inbox_task()

        mock_fetch.assert_called_once_with(limit=50)
        self.assertEqual(result, {"error": "IMAP connection failed"})
