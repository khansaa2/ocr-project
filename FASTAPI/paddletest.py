import os
import re
import json
import subprocess
import tempfile
from datetime import datetime
from PIL import Image
from paddleocr import PaddleOCR
import fitz  

OCR_LANG = "fr"
MODEL = "llama3:latest"  
OLLAMA_PATH = r"C:\Users\HP\AppData\Local\Programs\Ollama\ollama.exe"  
INPUT_FILE = "disway2.jpg"  
OUTPUT_DIR = "C:/Users/HP/Desktop/ocr_output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

ocr = PaddleOCR(lang=OCR_LANG, use_textline_orientation=True)


def parse_amount(s: str):
    """Convertit '10 027,00' ou '10027,00' -> float 10027.0"""
    if s is None:
        return None
    s = s.strip()
    s = s.replace("\u00A0", " ") 
    s = s.replace(" ", "")
    s = s.replace(",", ".")
    try:
        return float(s)
    except Exception:
        m = re.search(r"(\d+(\.\d+)?)", s)
        if m:
            return float(m.group(1))
    return None


def to_iso_date(d: str):
    """Convertit dd/mm/yyyy ou d/m/yy en YYYY-MM-DD"""
    if not d:
        return None
    d = d.strip()
    try:
        parts = d.split("/")
        if len(parts) == 3:
            day, month, year = parts
            day = int(day)
            month = int(month)
            year = int(year)
            if year < 100:
                year += 2000
            return datetime(year, month, day).strftime("%Y-%m-%d")
    except Exception:
        pass
    return None


def extract_text_with_ocr(image_path):
    
    results = ocr.predict([image_path])
    lines = []

    if not results:
        return []

    res = results[0]

    # Plusieurs formats possibles 
    if isinstance(res, dict):
        if "rec_texts" in res:
            for t in res["rec_texts"]:
                lines.append(t)
        elif "res" in res and isinstance(res["res"], list):
            for item in res["res"]:
                if isinstance(item, dict) and "text" in item:
                    lines.append(item["text"])
                elif isinstance(item, (list, tuple)) and len(item) >= 2:
                    lines.append(str(item[1]))
    elif isinstance(res, list):
        for item in res:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                cand = item[1]
                if isinstance(cand, (list, tuple)) and len(cand) >= 1:
                    cand = cand[0]
                lines.append(str(cand))
            elif isinstance(item, str):
                lines.append(item)

    clean = []
    for t in lines:
        if t is None:
            continue
        tt = str(t).strip()
        tt = tt.replace("\r", " ").replace("\t", " ")
        tt = re.sub(r"\s+", " ", tt)
        if tt:
            clean.append(tt)
    seen = set()
    final = []
    for l in clean:
        if l not in seen:
            seen.add(l)
            final.append(l)
    return final


def crop_bottom(image_path, height_ratio=0.25):
    img = Image.open(image_path)
    w, h = img.size
    crop_box = (0, int(h * (1 - height_ratio)), w, h)
    bottom = img.crop(crop_box)
    tmp_path = os.path.join(OUTPUT_DIR, "bottom_crop.jpg")
    bottom.save(tmp_path)
    return tmp_path


# -----------------------
# REGEX 
# -----------------------
def regex_preextract(text):
    """Extrait champs clés via regex; retourne dict de candidats (peuvent être None)."""
    out = {}

    txt = text.replace("\u00A0", " ")
    txt = re.sub(r"\s+-\s+", "-", txt)
    # ICE 
    ice_all = re.findall(r"ICE[:\s]*([0-9]{8,20})", txt, flags=re.IGNORECASE)
    out["ice_all"] = ice_all
    # IF 
    if_all = re.findall(r"(?:IF|I\.F\.|Identifiant fiscal)[^\d\n\r:]*([0-9]{4,20})", txt, flags=re.IGNORECASE)
    out["if_all"] = if_all
    # RC
    rc_all = re.findall(r"R\.?C\.?[:\s]*([0-9]{2,20})", txt, flags=re.IGNORECASE)
    out["rc_all"] = rc_all
    # Patente
    patente_all = re.findall(r"Patente[:\s]*([0-9]{4,20})", txt, flags=re.IGNORECASE)
    out["patente_all"] = patente_all
    # CNSS
    cnss_all = re.findall(r"C\.?N\.?S\.?S\.?[:\s]*([0-9]{2,20})", txt, flags=re.IGNORECASE)
    out["cnss_all"] = cnss_all
    # Numero facture
    invoice_matches = re.findall(r"\bF[0-9]{1,4}[-\s]?[0-9]{1,6}\b", txt)
    if not invoice_matches:
        m = re.search(r"(?:Facture|Facture et(?: Bon de Livraison)?)[:\s]*([A-Za-z0-9\-/_.]+)", txt, flags=re.IGNORECASE)
        if m:
            invoice_matches = [m.group(1)]
    out["invoice_all"] = invoice_matches
    # Dates 
    date_matches = re.findall(r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b", txt)
    out["dates_all"] = date_matches

    def find_amount_by_keywords(keywords):
        for line in txt.splitlines():
            for kw in keywords:
                if kw.lower() in line.lower():
                    m = re.search(r"([0-9]{1,3}(?:[ \u00A0][0-9]{3})*(?:,\d{2}))", line)
                    if m:
                        return parse_amount(m.group(1))
        m = re.search(r"(?:%s).{0,30}([0-9]{1,3}(?:[ \u00A0][0-9]{3})*(?:,\d{2}))" % "|".join(map(re.escape, keywords)), txt, flags=re.IGNORECASE)
        if m:
            return parse_amount(m.group(1))
        return None

    out["montant_ht"] = find_amount_by_keywords(["Sous-Total H.T.", "Sous-Total HT", "Montant H.T.", "Total H.T.", "Montant HT", "Prix Unitaire"])
    out["montant_tva"] = find_amount_by_keywords(["TVA", "T.V.A", "Taxe"])
    out["montant_ttc"] = find_amount_by_keywords(["Montant T.T.C", "Montant TTC", "Total TTC", "Montant T.T.C."])
    # Taux TVA 
    tva_rate = None
    m = re.search(r"([0-9]{1,2})\s*%", txt)
    if m:
        try:
            r = int(m.group(1))
            if 0 < r <= 40:
                tva_rate = r
        except:
            pass
    out["tva_rate"] = tva_rate

    out["raw_text"] = txt

    return out

# LLM 
def run_ollama(prompt):
    try:
        proc = subprocess.run(
            [OLLAMA_PATH, "run", MODEL],
            input=prompt.encode("utf-8"),
            capture_output=True,
            check=True,
            
        )
        resp = proc.stdout.decode("utf-8", errors="ignore").strip()
        return resp
    except subprocess.CalledProcessError as e:
        print(" Ollama CalledProcessError:", e, e.stdout, e.stderr)
        return None
    except Exception as e:
        print("Erreur Ollama:", e)
        return None


def parse_with_llm(full_text, client_text, fournisseur_text, preex):
   
    preex_json = json.dumps(preex, ensure_ascii=False, indent=2)

    prompt = f"""
Tu es un assistant expert en extraction de factures (français). Donne *uniquement* un JSON valide avec la structure demandée.
Ne réinvente pas ou ne recalcule pas les montants : si une valeur est fournie dans "preextraction", tu dois **utiliser** cette valeur. 
Ne change pas le format des nombres — fournis des floats pour les montants et ISO YYYY-MM-DD pour les dates.
Si un champ est absent, mets `null`.

--- Texte OCR global ---
{full_text}

--- Bloc Client (haut) ---
{client_text}

--- Bloc Fournisseur (bas) ---
{fournisseur_text}

--- Pre-extraction regex (valeurs candidates) ---
{preex_json}

### Format JSON attendu (strict) :
{{
  "fournisseur": {{
    "ice": null,
    "if": null,
    "raison_sociale": null,
    "cnss": null,
    "rc": null,
    "patente": null,
    "adresse": null
  }},
  "client": {{
    "ice": null,
    "raison_sociale": null
  }},
  "facture": {{
    "numero_facture": null,
    "date_facture": null,
    "date_echeance": null,
    "date_livraison": null,
    "montant_ht": null,
    "montant_tva": null,
    "taux_tva": null,
    "montant_ttc": null
  }}
}}

Important :
- Pour les champs juridiques (ICE, IF, RC, Patente, CNSS) **privilégie** les valeurs dans preextraction si elles existent.
- Les montants doivent provenir des preextraction (ne pas recalculer). Si preextraction ne trouve rien, tente d'extraire dans le texte.
- Réponds uniquement par le JSON (aucun commentaire).
- montant_ht peut étre ecris comme "Sous-Total H.T.", "Sous-Total HT", "Montant H.T.", "Total H.T.","Montant HT", "Prix Unitaire", "Total HT", "Hors Taxe", "HT"
- montant_tva peut étre ecris comme "TVA", "T.V.A", "Taxe" "Montant TVA", "Total TVA"
- montant_ttc peut étre ecris comme "Montant T.T.C", "Montant TTC", "Total TTC", "Montant T.T.C.","Total à payer", "Net à payer", "TOTAL", "TTC"
- if peut étre ecris comme "IF", "I.F.", "Identifiant fiscal", "-1.F."
"""
    resp = run_ollama(prompt)
    if not resp:
        return None

    m = re.search(r"(\{.*\})", resp, flags=re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception as e:
            print("⚠️ Impossible de parser JSON retourné par Ollama:", e)
            try:
                cleaned = m.group(1).replace("\n", " ")
                return json.loads(cleaned)
            except:
                return None
    else:
        return None


def merge_results(llm_json, preex, top_text, bottom_text):
    final = {
        "fournisseur": {
            "ice": None, "if": None, "raison_sociale": None, "cnss": None, "rc": None, "patente": None, "adresse": None
        },
        "client": {"ice": None, "raison_sociale": None},
        "facture": {"numero_facture": None, "date_facture": None, "date_echeance": None, "date_livraison": None,
                    "montant_ht": None, "montant_tva": None, "taux_tva": None, "montant_ttc": None}
    }

    def safe_get(obj, *path):
        cur = obj
        for p in path:
            if cur is None:
                return None
            cur = cur.get(p)
        return cur

    # 1) Commencer par LLM  pour les champs texte/raison_sociale/adresses
    if llm_json:
        for k in final["fournisseur"].keys():
            val = safe_get(llm_json, "fournisseur", k)
            if val is not None:
                final["fournisseur"][k] = val

        for k in final["client"].keys():
            val = safe_get(llm_json, "client", k)
            if val is not None:
                final["client"][k] = val

        for k in final["facture"].keys():
            val = safe_get(llm_json, "facture", k)
            if val is not None:
                final["facture"][k] = val

    # 2) Remplacer par preex lorsque c'est un champ jurique/numeric robuste
    # Fournisseur : ICE / IF / RC / PATENTE / CNSS
    if preex.get("ice_all"):
        final["fournisseur"]["ice"] = preex["ice_all"][-1] if preex["ice_all"] else final["fournisseur"]["ice"]
    if preex.get("if_all"):
        final["fournisseur"]["if"] = preex["if_all"][-1] if preex["if_all"] else final["fournisseur"]["if"]
    if preex.get("rc_all"):
        final["fournisseur"]["rc"] = preex["rc_all"][-1] if preex["rc_all"] else final["fournisseur"]["rc"]
    if preex.get("patente_all"):
        final["fournisseur"]["patente"] = preex["patente_all"][-1] if preex["patente_all"] else final["fournisseur"]["patente"]
    if preex.get("cnss_all"):
        final["fournisseur"]["cnss"] = preex["cnss_all"][-1] if preex["cnss_all"] else final["fournisseur"]["cnss"]

    
    top_ice = re.findall(r"ICE[:\s]*([0-9]{8,20})", top_text, flags=re.IGNORECASE)
    if top_ice:
        final["client"]["ice"] = top_ice[0]
    else:
        if preex.get("ice_all") and not final["client"]["ice"]:
            final["client"]["ice"] = preex["ice_all"][0]

    # Montants (HT, TVA, TTC)
    if preex.get("montant_ht") is not None:
        final["facture"]["montant_ht"] = float(preex["montant_ht"])
    if preex.get("montant_tva") is not None:
        final["facture"]["montant_tva"] = float(preex["montant_tva"])
    if preex.get("montant_ttc") is not None:
        final["facture"]["montant_ttc"] = float(preex["montant_ttc"])
    if preex.get("tva_rate") is not None:
        final["facture"]["taux_tva"] = preex["tva_rate"]

    
    dates = preex.get("dates_all", [])
    if dates:
        if len(dates) >= 1:
            df = to_iso_date(dates[0])
            final["facture"]["date_facture"] = df
        if len(dates) >= 2:
            de = to_iso_date(dates[-1])
            final["facture"]["date_echeance"] = de

    if preex.get("invoice_all"):
        final["facture"]["numero_facture"] = preex["invoice_all"][0]

    if not final["fournisseur"]["raison_sociale"]:
        m = re.search(r"([A-Z][A-Z0-9 \-]{3,})\s*RC", bottom_text, flags=re.IGNORECASE)
        if m:
            final["fournisseur"]["raison_sociale"] = m.group(1).strip()
        else:
            b_lines = [l.strip() for l in bottom_text.splitlines() if l.strip()]
            if b_lines:
                final["fournisseur"]["raison_sociale"] = b_lines[0]

    if not final["fournisseur"]["adresse"]:
        b_lines = [l.strip() for l in bottom_text.splitlines() if l.strip()]
        final["fournisseur"]["adresse"] = " ; ".join(b_lines[:3]) if b_lines else None

    for k in ["montant_ht", "montant_tva", "montant_ttc"]:
        val = final["facture"].get(k)
        if isinstance(val, str):
            parsed = parse_amount(val)
            final["facture"][k] = parsed

    return final


def process_invoice(image_path):
    lines_top = extract_text_with_ocr(image_path)
    top_text = "\n".join(lines_top)

    bottom_img = crop_bottom(image_path, 0.25)
    lines_bottom = extract_text_with_ocr(bottom_img)
    bottom_text = "\n".join(lines_bottom)

    full_text = top_text + "\n" + bottom_text

    print("=== OCR CLEANED (TOP) ===")
    print(top_text[:2000])
    print("=== OCR CLEANED (BOTTOM) ===")
    print(bottom_text[:2000])

    preex_top = regex_preextract(top_text)
    preex_bottom = regex_preextract(bottom_text)
    preex_full = regex_preextract(full_text)
    merged_preex = preex_full.copy()
    merged_preex["top_ice"] = preex_top.get("ice_all", [])
    merged_preex["bottom_ice"] = preex_bottom.get("ice_all", [])

    llm_json = parse_with_llm(full_text, top_text, bottom_text, merged_preex)

    final = merge_results(llm_json, merged_preex, top_text, bottom_text)
    return final


def process_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    results = []
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(dpi=300)
        tmp = os.path.join(tempfile.gettempdir(), f"page_{i+1}.jpg")
        pix.save(tmp)
        res = process_invoice(tmp)
        res["page"] = i + 1
        results.append(res)
    return results


if __name__ == "__main__":
    print("=== START ===")
    if INPUT_FILE.lower().endswith(".pdf"):
        results = process_pdf(INPUT_FILE)
    else:
        results = process_invoice(INPUT_FILE)
    out_path = os.path.join(OUTPUT_DIR, "invoice_parsed.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("=== RESULT ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    print("Saved to:", out_path)
