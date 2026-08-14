CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER enterprises_updated_at_trigger
BEFORE UPDATE ON enterprises
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER insurers_updated_at_trigger
BEFORE UPDATE ON insurers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER enterprise_insurers_updated_at_trigger
BEFORE UPDATE ON enterprise_insurers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER enterprise_insurer_suseps_updated_at_trigger
BEFORE UPDATE ON enterprise_insurer_suseps
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER clients_updated_at_trigger
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
