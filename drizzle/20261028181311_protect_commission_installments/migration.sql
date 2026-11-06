
CREATE FUNCTION public.inri_guard_commission_installments_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION
    'INRI: parcelas originais de comissão são imutáveis. Operação: %, registro: %',
    TG_OP,
    OLD.id
    USING ERRCODE = '23514';

  RETURN OLD;
END;
$function$;

--> statement-breakpoint

CREATE TRIGGER inri_commission_installments_immutable
BEFORE UPDATE OR DELETE
ON public.commission_installments
FOR EACH ROW
EXECUTE FUNCTION public.inri_guard_commission_installments_immutable();
