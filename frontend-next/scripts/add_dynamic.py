import os

pages = [
    r"e:\Projects-Repository\YesBill\frontend-next\app\add-service\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\analytics\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\analytics\[tab]\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\bills\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\calendar\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\chat\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\create-project\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\dashboard\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\forgot-password\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\login\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\services\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\services\[serviceId]\calendar\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\settings\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\settings\[tab]\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\setup\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\signup\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\auth\callback\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\auth\change-email\page.tsx",
    r"e:\Projects-Repository\YesBill\frontend-next\app\auth\reset-password\page.tsx",
]

line = "export const dynamic = 'force-dynamic'\n"
n = 0
for p in pages:
    if not os.path.exists(p):
        print("skip: " + p)
        continue
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    if "force-dynamic" not in c:
        with open(p, "w", encoding="utf-8", newline="") as f:
            f.write(line + c)
        n += 1
        print("ok: " + os.path.basename(os.path.dirname(p)))
print("total: " + str(n))
