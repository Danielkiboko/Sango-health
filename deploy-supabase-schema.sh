#!/bin/bash
# ==========================================================
# SangO Health — Appliquer le schéma Supabase automatiquement
# Usage: bash deploy-supabase-schema.sh VOTRE_SERVICE_ROLE_KEY
# ==========================================================

SERVICE_KEY="$1"
PROJECT_REF="fpfaerpzwkgivfluwvpe"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SQL_FILE="supabase_schema_rls_complet.sql"

if [ -z "$SERVICE_KEY" ]; then
  echo "❌ Usage: bash deploy-supabase-schema.sh <service_role_key>"
  echo "   Trouvez la clé sur: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
  exit 1
fi

echo "🚀 Application du schéma SangO Health sur Supabase..."
echo "   Projet: $PROJECT_REF"
echo ""

SQL_CONTENT=$(cat "$SQL_FILE")

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

# Méthode alternative via l'API SQL directe de Supabase Management API
echo "📡 Connexion à l'API de gestion Supabase..."

MGMT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(python3 -c "import json,sys; print(json.dumps(open('${SQL_FILE}').read()))")}")

MGMT_STATUS=$(echo "$MGMT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
MGMT_BODY=$(echo "$MGMT_RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$MGMT_STATUS" = "200" ] || [ "$MGMT_STATUS" = "201" ]; then
  echo "✅ Schéma appliqué avec succès ! (HTTP $MGMT_STATUS)"
  echo "   Tables créées: doctors, appointments, prescriptions, medical_documents, messages, invoices"
  echo "   Politiques RLS: activées pour Super Admins uniquement"
else
  echo "⚠️  Statut HTTP: $MGMT_STATUS"
  echo "   Réponse: $MGMT_BODY"
  echo ""
  echo "💡 Solution alternative: appliquez le SQL manuellement dans:"
  echo "   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
  echo "   (copiez le contenu du fichier: ${SQL_FILE})"
fi
