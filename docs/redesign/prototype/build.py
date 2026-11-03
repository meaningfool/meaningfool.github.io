"""Build the prototype: inline maps.js and the images into template.html, giving one index.html to open in a browser."""
import base64
import os

HERE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(HERE, "template.html")).read()
html = html.replace("{{MAPS_JS}}", open(os.path.join(HERE, "maps.js")).read())
for key, name in (("AGENT", "agent-sdks"), ("VOICE", "voice-todos"), ("LINEAGE", "data-lineage"), ("DIAGRAM", "structure-diagram")):
    data = base64.b64encode(open(os.path.join(HERE, "images", name + ".jpg"), "rb").read()).decode()
    html = html.replace("{{IMG_%s}}" % key, "data:image/jpeg;base64," + data)
open(os.path.join(HERE, "index.html"), "w").write(html)
print("index.html", len(html) // 1024, "KB")
