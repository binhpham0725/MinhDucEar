import re

with open('pages/index.php', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace PHP tags with clean root assets
content = re.sub(
    r'<script src="<\?=[^>]+>assets/js/player\.js\?v=<\?=[^>]+>"></script>',
    '<script src="assets/js/player.js"></script>',
    content
)
content = re.sub(
    r'<script type="module" src="<\?=[^>]+>scripts/index\.js"></script>',
    '<script type="module" src="scripts/index.js"></script>',
    content
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Generated index.html successfully!")
