-- Migration 020: Allow equipe to manage exames and sessoes across patients
-- This aligns RLS with the UI requirement that equipe can edit/delete exams and sessions.

-- EXAMES: add delete policy for admin/equipe
DROP POLICY IF EXISTS exames_delete ON exames;
CREATE POLICY exames_delete ON exames
  FOR DELETE
  USING (
    get_user_role() IN ('admin', 'equipe')
  );

-- SESSOES: allow equipe to update/delete all sessions (not only own)
DROP POLICY IF EXISTS sessoes_update ON sessoes;
CREATE POLICY sessoes_update ON sessoes
  FOR UPDATE
  USING (
    get_user_role() IN ('admin', 'equipe')
  )
  WITH CHECK (
    get_user_role() IN ('admin', 'equipe')
  );

DROP POLICY IF EXISTS sessoes_delete ON sessoes;
CREATE POLICY sessoes_delete ON sessoes
  FOR DELETE
  USING (
    get_user_role() IN ('admin', 'equipe')
  );
