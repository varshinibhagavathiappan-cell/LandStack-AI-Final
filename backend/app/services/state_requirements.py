from typing import Any, Dict, List

# Guidance only. The backend uses these records to select terminology/checklist candidates;
# it does not assert that every item is universally mandatory.
STATE_REQUIREMENTS: Dict[str, Dict[str, Dict[str, List[Dict[str, Any]]]]] = {
    "Tamil Nadu": {
        "LAND_PURCHASE_VERIFICATION": {
            "rural": [
                {"doc_type":"TITLE_DEED","name":"Registered Sale/Settlement Deed","required":True,"purpose":"Review title and property identifiers.","issuing_authority":"Sub-Registrar / certified copy where applicable"},
                {"doc_type":"PARENT_DEEDS","name":"Parent / Link Deeds","required":False,"purpose":"Trace prior registered transactions where relevant.","issuing_authority":"Registration Department / seller"},
                {"doc_type":"EXISTING_PATTA","name":"Patta / Chitta","required":False,"purpose":"Compare revenue holder, survey/subdivision and extent where applicable.","issuing_authority":"Tamil Nadu Revenue services"},
                {"doc_type":"FMB_SKETCH","name":"FMB / Survey Record","required":False,"purpose":"Compare survey measurements and boundaries where relevant.","issuing_authority":"Survey & Land Records / Revenue"},
                {"doc_type":"ENCUMBRANCE_CERTIFICATE","name":"Encumbrance Certificate","required":False,"purpose":"Review registered transactions/encumbrances for the searched period.","issuing_authority":"Registration Department"}
            ],
            "urban": [
                {"doc_type":"TITLE_DEED","name":"Registered Sale/Settlement Deed","required":True,"purpose":"Review title and property identifiers.","issuing_authority":"Sub-Registrar / certified copy where applicable"},
                {"doc_type":"ENCUMBRANCE_CERTIFICATE","name":"Encumbrance Certificate","required":False,"purpose":"Review registered transactions for the searched period.","issuing_authority":"Registration Department"},
                {"doc_type":"TAX_RECEIPT","name":"Latest Property Tax / Assessment Record","required":False,"purpose":"Cross-check the municipal/property context where applicable.","issuing_authority":"Local body"},
                {"doc_type":"FMB_SKETCH","name":"Survey / FMB / TSLR Record","required":False,"purpose":"Use the applicable urban survey record where relevant.","issuing_authority":"Survey & Land Records"}
            ]
        }
    },
    "Karnataka": {
        "LAND_PURCHASE_VERIFICATION": {
            "rural": [
                {"doc_type":"REGISTERED_SALE_DEED","name":"Registered Sale Deed / Ownership Document","required":True,"purpose":"Review the registered transaction and title identifiers.","issuing_authority":"Registration Department / Kaveri"},
                {"doc_type":"RTC_PAHAANI","name":"RTC / Record of Rights and Tenancy Certificate (Pahani where applicable)","required":False,"purpose":"Review the relevant land/revenue record for the parcel.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"MUTATION_RECORD","name":"Mutation Register / Mutation Status","required":False,"purpose":"Review changes recorded in the revenue record.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"ENCUMBRANCE_CERTIFICATE","name":"Encumbrance Certificate","required":False,"purpose":"Review registered encumbrances for the searched period.","issuing_authority":"Kaveri / Registration Department"},
                {"doc_type":"SURVEY_ATLAS_PT_SHEET","name":"Survey / Atlas / PT Sheet information","required":False,"purpose":"Use applicable survey evidence to reconcile boundaries and extent.","issuing_authority":"Survey & Land Records / Revenue"}
            ],
            "urban": [
                {"doc_type":"REGISTERED_SALE_DEED","name":"Registered Sale Deed / Ownership Document","required":True,"purpose":"Review registered title transaction.","issuing_authority":"Registration Department / Kaveri"},
                {"doc_type":"ENCUMBRANCE_CERTIFICATE","name":"Encumbrance Certificate","required":False,"purpose":"Review registered encumbrances for the searched period.","issuing_authority":"Registration Department / Kaveri"},
                {"doc_type":"KHATA_RECORD","name":"Khata / e-Aasthi or applicable municipal property record","required":False,"purpose":"Relevant for applicable urban property contexts.","issuing_authority":"Applicable urban local body"},
                {"doc_type":"PROPERTY_TAX_RECORD","name":"Latest Property Tax Record","required":False,"purpose":"Cross-check the applicable municipal property context.","issuing_authority":"Applicable urban local body"},
                {"doc_type":"SURVEY_ATLAS_PT_SHEET","name":"Survey / property plan record","required":False,"purpose":"Use applicable survey/property plan evidence.","issuing_authority":"Applicable authority"}
            ]
        },
        "INHERITED_LAND_TRANSFER": {
            "rural": [
                {"doc_type":"RTC_PAHAANI","name":"RTC / Pahani where applicable","required":False,"purpose":"Review the current revenue record.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"MUTATION_RECORD","name":"Mutation Record / Status","required":False,"purpose":"Review recorded ownership changes.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"REGISTERED_SALE_DEED","name":"Registered Ownership Document","required":False,"purpose":"Trace the deceased holder's recorded acquisition where available.","issuing_authority":"Registration Department / Kaveri"},
                {"doc_type":"DEATH_CERTIFICATE","name":"Death Certificate if applicable to the case","required":False,"purpose":"Evidence of the recorded death event when inheritance is based on death.","issuing_authority":"Competent civil registration authority"},
                {"doc_type":"LEGAL_HEIR_EVIDENCE","name":"Applicable legal-heir / succession evidence","required":False,"purpose":"Establish the relevant succession facts; requirements depend on the case.","issuing_authority":"Competent authority / legal professional"}
            ],
            "urban": [
                {"doc_type":"REGISTERED_SALE_DEED","name":"Registered Ownership Document","required":False,"purpose":"Trace recorded acquisition.","issuing_authority":"Registration Department / Kaveri"},
                {"doc_type":"KHATA_RECORD","name":"Khata / e-Aasthi or applicable municipal property record","required":False,"purpose":"Relevant for applicable urban property context.","issuing_authority":"Applicable urban local body"},
                {"doc_type":"PROPERTY_TAX_RECORD","name":"Property Tax Record","required":False,"purpose":"Cross-check applicable municipal records.","issuing_authority":"Applicable urban local body"}
            ]
        },
        "PATTA_TRANSFER": {
            "rural": [
                {"doc_type":"RTC_PAHAANI","name":"RTC / Pahani where applicable","required":False,"purpose":"Review the current revenue entry.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"MUTATION_RECORD","name":"Mutation Record / Status","required":False,"purpose":"Review recorded changes.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"REGISTERED_SALE_DEED","name":"Relevant Registered Ownership Document","required":False,"purpose":"Support the requested ownership-record change where applicable.","issuing_authority":"Registration Department / Kaveri"}
            ],
            "urban": [
                {"doc_type":"KHATA_RECORD","name":"Khata / e-Aasthi or applicable municipal property record","required":False,"purpose":"Relevant for applicable urban property contexts.","issuing_authority":"Applicable urban local body"},
                {"doc_type":"PROPERTY_TAX_RECORD","name":"Current Property Tax Record","required":False,"purpose":"Cross-check the property record context.","issuing_authority":"Applicable urban local body"},
                {"doc_type":"REGISTERED_SALE_DEED","name":"Relevant Registered Ownership Document","required":False,"purpose":"Support the recorded transaction.","issuing_authority":"Registration Department / Kaveri"}
            ]
        },
        "BOUNDARY_DISPUTE": {
            "rural": [
                {"doc_type":"RTC_PAHAANI","name":"RTC / Pahani where applicable","required":False,"purpose":"Compare survey identity and extent.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"MUTATION_RECORD","name":"Mutation Record / Status","required":False,"purpose":"Review changes affecting the revenue record.","issuing_authority":"Bhoomi / Revenue Department"},
                {"doc_type":"SURVEY_ATLAS_PT_SHEET","name":"Survey / Atlas / PT Sheet information","required":False,"purpose":"Compare boundaries and survey evidence.","issuing_authority":"Survey & Land Records / Revenue"}
            ],
            "urban": [
                {"doc_type":"KHATA_RECORD","name":"Khata / applicable municipal property record","required":False,"purpose":"Review the urban property identifier where relevant.","issuing_authority":"Applicable urban local body"},
                {"doc_type":"SURVEY_ATLAS_PT_SHEET","name":"Survey / property plan record","required":False,"purpose":"Compare boundaries and parcel identifiers.","issuing_authority":"Applicable authority"}
            ]
        },
        "DOCUMENT_EXPLANATION": {"rural": [{"doc_type":"GENERAL_LAND_RECORD","name":"Land document supplied by the citizen","required":True,"purpose":"Primary document for AI-assisted explanation.","issuing_authority":"Citizen / issuing authority"}], "urban": [{"doc_type":"GENERAL_LAND_RECORD","name":"Property document supplied by the citizen","required":True,"purpose":"Primary document for AI-assisted explanation.","issuing_authority":"Citizen / issuing authority"}]},
        "LAND_RECORD_SEARCH": {"rural": [{"doc_type":"GENERAL_LAND_RECORD","name":"Relevant Karnataka land record","required":False,"purpose":"Use only if the citizen already has a record to explain or compare.","issuing_authority":"Applicable Karnataka authority"}], "urban": [{"doc_type":"GENERAL_LAND_RECORD","name":"Relevant urban property record","required":False,"purpose":"Use only if the citizen already has a record to explain or compare.","issuing_authority":"Applicable urban authority"}]}
    }

}

def infer_context(state: str, land_type: str = "") -> str:
    s = (land_type or "").lower()
    if any(k in s for k in ["urban", "bengaluru", "bangalore", "bbmp", "municipal", "khata"]):
        return "urban"
    return "rural"

def requirements_for(state: str, intent: str, land_type: str = "") -> List[Dict[str, Any]]:
    state_data = STATE_REQUIREMENTS.get(state, {})
    intent_data = state_data.get(intent, {})
    return intent_data.get(infer_context(state, land_type), [])
