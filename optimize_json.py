import json

def optimize_medical_json(input_file, output_file):
    try:
        # 1. Köhnə JSON faylını oxuyuruq
        with open(input_file, 'r', encoding='utf-8') as f:
            old_data = json.load(f)

        new_categories = {}
        new_services = []

        for item in old_data:
            # 2. Kateqoriya məlumatını götürürük
            cat = item.get('category', {})
            cat_id = cat.get('id')

            # Əgər bu kateqoriya hələ yeni lüğətimizdə yoxdursa, əlavə edirik
            if cat_id and cat_id not in new_categories:
                new_categories[cat_id] = {
                    "id": cat_id,
                    "name": cat.get('name'),
                    "image": cat.get('image')
                }

            # 3. Xidmət məlumatını sadələşdiririk
            # Lazımsız null və təkrarlanan sahələri təmizləyirik
            simplified_service = {
                "id": item.get('id'),
                "cat_id": cat_id,
                "no": item.get('no'),
                "name": item.get('name'),
                "xbt": item.get('xbt') if item.get('xbt') != "Tətbiq edilmir" else None,
                "price": item.get('price') if item.get('price') else "0"
            }
            new_services.append(simplified_service)

        # 4. Yeni strukturu hazırlayırıq
        final_data = {
            "categories": new_categories,
            "services": new_services
        }

        # 5. Yeni fayla yazırıq (yaddaşa qənaət üçün indent=2 kifayətdir)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

        print(f"Uğurlu! Fayl kiçildildi: {output_file}")
        
    except Exception as e:
        print(f"Xəta baş verdi: {e}")

# Skripti işlət
optimize_medical_json('xidmetler-kohne.json', 'xidmetler-yeni.json')