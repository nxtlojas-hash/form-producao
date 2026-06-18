# -*- coding: utf-8 -*-
"""Monta o blueprint do Make (Webhook->Iterator->Excel addAWorksheetRow) reaproveitando o esquema do form-pj."""
import json, os, copy

PJ=os.path.join("C:\\","dev","NXT","ativos","form-pj","blueprint-new.json")
OUT=os.path.join("C:\\","dev","NXT","ativos","form-producao","make-blueprint.json")
bp=json.load(open(PJ,encoding="utf-8"))["blueprint"]

# --- pega os 3 módulos-modelo ---
webhook=copy.deepcopy([m for m in bp["flow"] if m["module"]=="gateway:CustomWebHook"][0])
feeder =copy.deepcopy([m for m in bp["flow"] if m["module"]=="builtin:BasicFeeder"][0])
excel  =copy.deepcopy([m for g in bp["metadata"]["designer"]["orphans"] for m in g
                       if m.get("module")=="microsoft-excel:addAWorksheetRow"][0])

# --- WEBHOOK (id 1): zera o hook (ela seleciona o "producao-nxt" no import) ---
webhook["id"]=1
webhook["parameters"]["hook"]=None
webhook["metadata"]["designer"]={"x":0,"y":0}
webhook["metadata"].setdefault("restore",{}).setdefault("parameters",{})["hook"]={"label":"producao-nxt"}

# --- FEEDER/ITERATOR (id 2): itera sobre motos[] ---
feeder["id"]=2
feeder["mapper"]={"array":"{{1.motos}}"}
feeder["metadata"]["designer"]={"x":300,"y":0}

# --- EXCEL addAWorksheetRow (id 3): mapeia 8 colunas da Produção Diária ---
excel["id"]=3
excel["mapper"]["row"]={
    "0":"{{1.data}}",      # A Data
    "1":"{{2.modelo}}",    # B Modelo
    "2":"{{2.cor}}",       # C Cor
    "3":"{{2.chassi}}",    # D Chassi
    "4":"{{2.motor}}",     # E Motor
    "5":"{{2.estado}}",    # F Estado
    "6":"{{1.galpao}}",    # G Local
    "7":"{{2.obs}}",       # H Obs
}
excel["mapper"]["select"]="list"
excel["mapper"]["selectB"]="my"
excel["mapper"]["workbook"]="/Estoques/NXT - Estoque Junho 2026.xlsx"
excel["mapper"]["worksheet"]="📥 Produção Diária"
excel["mapper"]["valueType"]="values"
excel["metadata"]["designer"]={"x":600,"y":0}
# mantém o __IMTCONN__ (conexão MS365 da conta dela do form-pj); se não servir, ela reconecta

# --- monta o blueprint final ---
out={
    "name":"NXT - Produção Diária",
    "flow":[webhook, feeder, excel],
    "metadata":{
        "instant":True, "version":1,
        "scenario":bp["metadata"].get("scenario",{}),
        "designer":{"orphans":[]},
        "zone":"us2.make.com",
    }
}
json.dump(out, open(OUT,"w",encoding="utf-8"), ensure_ascii=False, indent=1)
print("blueprint salvo em make-blueprint.json")
print("módulos:", [(m["id"],m["module"]) for m in out["flow"]])
print("excel conn (__IMTCONN__):", excel["parameters"])
print("workbook:", excel["mapper"]["workbook"], "| worksheet:", excel["mapper"]["worksheet"])
print("tamanho:", os.path.getsize(OUT), "bytes")
