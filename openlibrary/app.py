"""Utilities to build the app."""

from web.template import TemplateResult

from infogami.utils import app as _app
from infogami.utils.macro import macro
from infogami.utils.view import public, render

import requests
import re
import time
import os

class view(_app.page):
    """A view is a class that defines how a page or a set of pages
    identified by a regular expression are rendered.

    Here is a sample view::

        from openlibrary import app

        class hello(app.view):
            path = "/hello/(.*)"

            def GET(self, name):
                return app.render_template("hello", name)
    """

    # In infogami, the class with this functionality is called page.
    # We are redefining with a slightly different terminology to make
    # things more readable.
    pass


# view is just a base class.
# Defining a class extending from _app.page auto-registers it inside infogami.
# Undoing that.
del _app.pages['/view']


class subview(_app.view):
    """Subviews are views that work an object in the database.

    Each subview URL will have two parts, the prefix identifying the key
    of the document in the database to work on and the suffix iden identifying
    the action.

    For example, the in the subview with URL "/works/OL123W/foo/identifiers",
    "identifiers" is the action and "/works/OL123W" is the key of the document.
    The middle part "foo" is added by a middleware to make the URLs readable
    and not that is transparent to this.

    Here is a sample subview:

        class work_identifiers(delegate.view):
            suffix = "identifiers"
            types = ["/type/edition"]
    """

    # In infogami, the class with this functionality is called a view.
    # We are redefining with a slightly different terminology to make
    # things more readable.

    # Tell infogami not to consider this as a view class
    suffix = None
    types = None

doctype_regex = re.compile(r'^\\s*<!DOCTYPE html>\\s*', re.IGNORECASE)

@macro
@public
def render_template(name: str, *a, **kw) -> str:
    if "." in name:
        name = name.rsplit(".", 1)[0]

    html = str(render[name](*a, **kw))

    ssr_url = os.environ.get('SSR_URL')
    if not ssr_url:
      return html

    start_time = time.time()

    try:
      html_to_process = html

      match = doctype_regex.search(html)
      if match:
        html_to_process = doctype_regex.sub('', html, count=1)

      response = requests.post(ssr_url, data=html_to_process)
      response.raise_for_status()

      duration_ms = (time.time() - start_time) * 1000
      processed_html = response.text + f'<!-- SSR processed in {duration_ms}ms -->'

      if match:
        processed_html = '<!DOCTYPE html>\\n' + processed_html

      return processed_html

    except requests.exceptions.RequestException as e:
      print(f"Error making POST request: {e}")
      return html
