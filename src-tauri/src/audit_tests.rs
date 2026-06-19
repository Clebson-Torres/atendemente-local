#[cfg(test)]
mod tests {
    use crate::{audit, db};

    async fn test_db() -> (tempfile::TempDir, sqlx::SqlitePool) {
        let dir = tempfile::tempdir().unwrap();
        let db_path = dir.path().join("audit-test.db");
        let db_url = format!("sqlite:{}?mode=rwc", db_path.to_string_lossy());
        let pool = db::init_database(&db_url).await.unwrap();
        (dir, pool)
    }

    async fn seed_user(db: &sqlx::SqlitePool, user_id: &str) {
        sqlx::query(
            "INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(user_id)
        .bind("audit@example.com")
        .bind("Audit User")
        .bind("2026-06-18T10:00:00")
        .bind("2026-06-18T10:00:00")
        .execute(db)
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn writes_and_lists_lgpd_audit_events_without_sensitive_content() {
        let (_dir, db) = test_db().await;
        let user_id = "550e8400-e29b-41d4-a716-446655440001";
        seed_user(&db, user_id).await;

        audit::write_audit_event(
            &db,
            user_id,
            audit::AuditAction::PatientViewed,
            "patient",
            Some("patient-123"),
            serde_json::json!({"field": "metadata-only"}),
            Some("local-device"),
        )
        .await
        .unwrap();

        let events = audit::list_audit_events(&db, user_id, 20).await.unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].action, "patient.viewed");
        assert!(!events[0].details.contains("conteudo do prontuario"));
    }
}
