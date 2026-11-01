"""Smoke tests for SCOUTS Planet workspace. Requires python playwright + Chromium.
Run: python scouts/tests/test_planet_ui.py
"""
from pathlib import Path
import json
import re
import shutil
from playwright.sync_api import sync_playwright

SOURCE = Path(__file__).resolve().parents[1] / 'SCOUTS_Calculator_v6.js'
source = SOURCE.read_text(encoding='utf-8')
match = re.search(r'const PLANET_WORKSPACE_HTML=(".*?");\n', source, re.S)
assert match, 'Embedded planet workspace missing'
html = json.loads(match.group(1))

coords = [(0,0),(1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1)]
def snapshot(count=7, level=0, minerals=20000):
    cells = []
    for x,y in coords[:count]:
        building = ({'type':'60','level':1,'active':True} if (x,y)==(0,0) else
                    {'type':'20','level':level,'recipe':'reagents','active':True} if (x,y)==(1,0) and level else None)
        cells.append({'x':x,'y':y,'terrain':'grass_1',
                      'has_foundation':(x,y)==(0,0) or ((x,y)==(1,0) and level>0),
                      'building':building})
    return json.dumps({'event':'planetaryBase','data':{'name':'Fixture planet',
                      'base':{'id':'fixture-planet-1','cells':cells,
                      'stock':{'minerals':minerals,'aluminium':60000,'ferrum':40000},
                      'energy':{'reserve':25000}}}})

def test():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=shutil.which("chromium") or None)
        page = browser.new_page(viewport={'width':1300,'height':900})
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html)
        def import_snapshot(value):
            page.locator('[data-act=paste-snapshot]').first.click()
            page.locator('#snapshot-json').fill(value)
            page.locator('[data-act=confirm-paste]').click()
        assert 'Загрузи снимок' in page.locator('#sidebar').inner_text()
        assert page.locator('#grid-size').count()==0
        import_snapshot(snapshot())
        assert '7 реальных' in page.locator('#base-meta').inner_text()
        page.locator('[data-mode=build]').first.click()
        page.locator('[data-cell="1,0"]').click()
        page.locator('#build-code').select_option('20')
        page.locator('#build-level').select_option('2')
        page.locator('[data-act=queue-build]').click()
        assert '3 шаг' in page.locator('#sidebar').inner_text()
        assert 'Фундамент' in page.locator('#sidebar').inner_text()
        page.locator('#deep-materials').check()
        assert 'Первичное сырьё' in page.locator('#sidebar').inner_text()
        import_snapshot(snapshot(6))
        assert 'Ожидалось 7 гексов' in page.locator('#sidebar').inner_text()
        page.locator('[data-act=close-paste]').click()
        import_snapshot(snapshot(level=1))
        assert 'выполнено шагов плана: 2' in page.locator('#sidebar').inner_text()
        page.locator('[data-mode=build]').first.click()
        assert '1 шаг' in page.locator('#sidebar').inner_text()
        assert 'Улучшить Фабрика' in page.locator('#sidebar').inner_text()
        import_snapshot(snapshot(level=2))
        assert 'выполнено шагов плана: 1' in page.locator('#sidebar').inner_text()
        page.locator('[data-mode=build]').first.click()
        assert '0 шаг' in page.locator('#sidebar').inner_text()
        assert not errors, errors
        browser.close()
        print('PASS: fixed server geometry, two modes, multi-step costs, raw decomposition, repeated updates, completed-plan reconciliation')

if __name__=='__main__': test()