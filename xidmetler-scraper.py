import requests
import json
import time

# Saytın daxili API ünvanı
API_URL = "https://its.gov.az/services"

all_data = []
page = 1

print("Məlumatların çəkilməsi başladı...")

while True:
    params = {
        'category_id': 0, # Bütün kateqoriyalar
        'page': page,
        'search': '',
        'data_category_id': ''
    }
    
    try:
        response = requests.get(API_URL, params=params)
        
        # Əgər status 200 deyilsə və ya boşdursa, dayandır
        if response.status_code != 200:
            break
            
        data = response.json()
        
        # JS kodunda 'response.data ? response.data : response' məntiqinə uyğun:
        items = data.get('data', data)
        
        if not items or len(items) == 0:
            print("Bütün səhifələr oxundu.")
            break
            
        all_data.extend(items)
        print(f"Səhifə {page} tamamlandı. Toplam {len(all_data)} xidmət toplandı.")
        
        page += 1
        time.sleep(0.5) # Saytı yükləməmək üçün qısa fasilə
        
    except Exception as e:
        print(f"Xəta baş verdi: {e}")
        break

# JSON faylına yazmaq
with open('its_xidmetler_tam_siyahi.json', 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=4)

print(f"Əməliyyat bitdi! 'its_xidmetler_tam_siyahi.json' faylı yaradıldı.")