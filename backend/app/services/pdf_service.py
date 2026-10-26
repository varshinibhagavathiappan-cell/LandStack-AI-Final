import os
import io
from typing import Dict, Any
from datetime import datetime

class LandCaseFileGenerator:
    @staticmethod
    def generate_html_report(case_data: Dict[str, Any]) -> str:
        """
        Generates a professional, responsive, printable HTML Land Case File.
        Strictly includes statutory disclaimer: AI-assisted case summary — not a legal certificate.
        """
        case_id = case_data.get("case_id", "TN-CASE-2026-0924")
        citizen = case_data.get("citizen_name", "Citizen")
        problem = case_data.get("problem_statement", "Land service assistance")
        intent = case_data.get("intent_title", "Land Title & Revenue Service")
        stage = case_data.get("stage", "VERIFICATION")
        readiness = case_data.get("readiness_score", 40)
        docs = case_data.get("uploaded_documents", [])
        gaps = case_data.get("verification_gaps", [])
        missing = case_data.get("missing_links", [])
        next_action = case_data.get("next_best_action") or {}
        passport = case_data.get("property_passport") or {}

        docs_html = ""
        for d in docs:
            docs_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">{d.get('title')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{d.get('doc_type')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><span style="background: #e6fffa; color: #234e52; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{d.get('status')}</span></td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #4a5568;">{d.get('label', 'AI-assisted extraction')}</td>
            </tr>
            """

        gaps_html = ""
        for g in gaps:
            badge_bg = "#feebc8" if g.get("severity") == "HIGH" else "#edf2f7"
            badge_color = "#744210" if g.get("severity") == "HIGH" else "#2d3748"
            status_color = "#c53030" if g.get("status") == "OPEN" else "#2f855a"
            gaps_html += f"""
            <div style="background: #fffaf0; border-left: 4px solid #dd6b20; padding: 14px; margin-bottom: 12px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong style="color: #9c4221; font-size: 15px;">{g.get('title')}</strong>
                    <span style="background: {badge_bg}; color: {badge_color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">{g.get('severity')} SEVERITY</span>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #4a5568;">{g.get('description')}</p>
                <div style="font-size: 13px; color: #2d3748; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #fed7d7;">
                    <strong>Next Step:</strong> {g.get('suggested_action')} | <strong>Status:</strong> <span style="color: {status_color}; font-weight: bold;">{g.get('status')}</span>
                </div>
            </div>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>LandStack AI Case File - {case_id}</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; background: #f7fafc; color: #1a202c; }}
                .container {{ max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
                .header {{ border-bottom: 2px solid #3182ce; padding-bottom: 20px; margin-bottom: 24px; }}
                .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
                .disclaimer-banner {{ background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 6px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #2b6cb0; text-align: center; }}
                h2 {{ color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; font-size: 18px; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                th {{ background: #edf2f7; text-align: left; padding: 10px; font-size: 13px; color: #4a5568; }}
                .score-circle {{ display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: #ebf8ff; border: 3px solid #3182ce; font-weight: bold; font-size: 20px; color: #2b6cb0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="disclaimer-banner">
                    ⚠️ <strong>IMPORTANT LEGAL NOTICE</strong>: This document is an <strong>AI-assisted case summary</strong> prepared by LandStack AI to assist citizens in preparing documentation. It is <strong>NOT a legal certificate</strong>, title warranty, or government order. Official revenue records remain solely authoritative.
                </div>

                <div class="header">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-size: 12px; letter-spacing: 1px; color: #4a5568; font-weight: bold;">LANDSTACK AI • LIVING LAND CASE</span>
                            <h1 style="margin: 4px 0 8px 0; color: #1a365d; font-size: 26px;">Land Decision Case Dossier</h1>
                            <div style="font-size: 14px; color: #718096;">Case Identifier: <strong>{case_id}</strong> | Generated on {datetime.now().strftime("%d %b %Y, %I:%M %p")}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="score-circle">{readiness}%</div>
                            <div style="font-size: 12px; color: #718096; margin-top: 4px;">Application Readiness</div>
                        </div>
                    </div>
                </div>

                <h2>1. Case Overview & Problem Statement</h2>
                <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px 0;"><strong>Citizen:</strong> {citizen} | <strong>Jurisdiction:</strong> {case_data.get('district', 'Not provided')}, {case_data.get('state', 'Not provided')}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Citizen Problem Statement:</strong> <em>"{problem}"</em></p>
                    <p style="margin: 0 0 8px 0;"><strong>Detected Intent:</strong> <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 600;">{intent}</span></p>
                    <p style="margin: 0;"><strong>Current Lifecycle Stage:</strong> <span style="color: #2b6cb0; font-weight: bold;">{stage}</span></p>
                </div>

                <h2>2. Land DNA / Property Passport</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #fff; border: 1px solid #cbd5e0; padding: 16px; border-radius: 6px;">
                    <div><strong>Survey & Sub-division:</strong> {passport.get('survey_number', 'Not provided')}</div>
                    <div><strong>Recorded Owner:</strong> {passport.get('recorded_owner', 'Not provided')}</div>
                    <div><strong>Deed Extent:</strong> {passport.get('extent_acres', 'Not provided')}</div>
                    <div><strong>Patta Extent:</strong> {passport.get('extent_acres', 'Not provided')} Acres</div>
                    <div><strong>Taluk / Village:</strong> {passport.get('taluk', 'Not provided')} / {passport.get('village', 'Not provided')}</div>
                    <div><strong>Dispute / Inconsistency Status:</strong> <span style="color: #c53030; font-weight: bold;">{passport.get('dispute_flag', 'Not determined from available evidence')}</span></div>
                </div>

                <h2>3. Verification Gaps & Inconsistencies Detected</h2>
                {gaps_html if gaps_html else '<p style="color: #4a5568;">No outstanding verification gaps.</p>'}

                <h2>4. Uploaded Evidence & AI Extraction</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Provenance / Extractor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {docs_html}
                    </tbody>
                </table>

                <h2>5. Next-Best Action Recommended</h2>
                <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 16px; border-radius: 4px;">
                    <h3 style="margin: 0 0 8px 0; color: #2b6cb0;">{next_action.get('title', 'Reconcile Land Area')}</h3>
                    <p style="margin: 0 0 12px 0; font-size: 14px;">{next_action.get('summary', 'Upload latest field measurement book to resolve area difference.')}</p>
                    <strong>Action Steps:</strong>
                    <ol style="margin: 6px 0 0 0; padding-left: 20px; font-size: 14px;">
                        {''.join([f"<li>{s}</li>" for s in next_action.get('step_by_step', [])])}
                    </ol>
                    {f"<p style='margin-top: 10px; font-size: 13px;'><strong>Official Route:</strong> <a href='{next_action.get('official_service_url')}' target='_blank'>{next_action.get('official_service_url')}</a></p>" if next_action.get('official_service_url') else ""}
                </div>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #a0aec0; text-align: center;">
                    Generated by LandStack AI Decision Copilot • RAG & Agentic Architecture • Not an Official Land Title Document
                </div>
            </div>
        </body>
        </html>
        """

pdf_service = LandCaseFileGenerator()
