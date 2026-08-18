CREATE TRIGGER account_updated_at_trigger
BEFORE UPDATE ON account
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER session_updated_at_trigger
BEFORE UPDATE ON session
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER verification_updated_at_trigger
BEFORE UPDATE ON verification
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();