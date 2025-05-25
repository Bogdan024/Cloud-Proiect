Proiect Cloud - Aplicație de live chat

Custura Bogdan-Petrisor
Grupa 1132

Link video: https://www.youtube.com/watch?v=jzokqOz-jOs

Link site publicat: http://51.21.165.154/liveChat

Link proiect Github: https://github.com/Bogdan024/Cloud-Proiect 

Introducere
Aplicația de tip live chat în cloud permite comunicarea instantanee între utilizatori autentificați. Scopul principal al aplicației este de a facilita schimbul de mesaje text în timp real, fără întârzieri notabile, folosind tehnologii moderne. Aplicația folosește Next.js (pentru interfața front-end și server-side rendering), WebSocket (pentru comunicare bidirecțională instantanee), JSON Web Token (JWT) (pentru autentificare securizată) și un REST API (pentru operații de creare și citire asupra datelor de chat). Arhitectura bazată pe cloud asigură scalabilitate și accesibilitate permanentă a serviciului.

Descrierea problemei
În era digitală, utilizatorii au nevoie de comunicare în timp real prin mesaje text, similar aplicațiilor moderne de chat. Aplicarea acestei soluții în cloud aduce următoarele avantaje:
•	Comunicare instantanee: conversațiile apar imediat ce un mesaj este trimis, facilitând interacțiuni rapide între utilizatori. Aceasta este esențială în contexte precum echipe de lucru la distanță sau platforme sociale.
•	Autentificare și securitate: fiecare utilizator trebuie să se autentifice pentru a trimite și primi mesaje. Folosind JWT, asigurăm că accesul la chat este permis numai utilizatorilor validați și prevenim accesul neautorizat.
•	Scalabilitate: o aplicație de chat în cloud poate susține un număr mare de utilizatori concurenți, datorită infrastructurii scalabile și a comunicării eficiente prin WebSocket.
Astfel, problema adresată este nevoia unei aplicații moderne și securizate de chat în timp real, care să permită comunicarea eficientă între utilizatori autentificați.


Descriere API
Serverul aplicației oferă atât endpoint-uri REST, cât și un canal WebSocket pentru funcționalitățile principale. Exemple de rute disponibile:
•	POST /api/register – Înregistrează un utilizator nou.
Request: { "name": "Nume", "email": "exemplu@mail.com", "password": "parola" }
Response: { "token": "JWT_GENERAT", "user": { "id": 1, "name": "Nume", "email": "exemplu@mail.com" } }
•	POST /api/login – Autentifică un utilizator existent.
Request: { "email": "exemplu@mail.com", "password": "parola" }
Response: { "token": "JWT_GENERAT", "user": { "id": 1, "name": "Nume", "email": "exemplu@mail.com" } }
•	GET /api/users – Returnează lista de utilizatori înregistrați (accesibil doar utilizatorilor autentificați).
•	GET /api/messages – Returnează istoricul de mesaje, solicitare de tip GET cu antetul Authorization: Bearer <JWT>.
•	PUT si DELETE /api/[messages].js – Editeaza sau sterge un mesaj selectat de user si updateaza setarile si pentru cel ce receptioneaza mesajul.

Raspuns la request-ul de GET asupra tuturor mesajelor din conversatie
 

Funcționarea JWT: După autentificare prin /api/login sau /api/register, serverul generează un token JWT semnat cu o cheie secretă. Tokenul include informații despre utilizator (de exemplu, id-ul și numele) și o dată de expirare. Acest token este returnat clientului și trebuie salvat in localStorage. Pentru orice cerere viitoare către API (sau la conectarea la WebSocket), clientul include tokenul în antetul Authorization (Bearer <token>). Serverul verifică validitatea tokenului la fiecare solicitare și permite accesul doar dacă acesta este valid.
Canale WebSocket: Aplicația folosește WebSocket (de exemplu, cu Socket.IO) pentru comunicarea în timp real. După autentificare, clientul deschide o conexiune WebSocket către server, trimițând tokenul JWT pentru autentificare. Serverul validează tokenul și, dacă utilizatorul este autorizat, se stabileste conexiunea, are loc acel WebSocket handshake, dupa care se abandoneaza protocolul HTTP si se schimba pe protocolul WebSocket. Mesajele trimise de client pe acest canal ajung imediat la server, care le procesează și le retransmite către ceilalți clienți conectați. Astfel, utilizatorii primesc mesajele noi în timp real.

Upgrade la protocolul webSocket
 
Deploy în cloud
Aplicația este containerizată folosind Docker, ceea ce oferă portabilitate și consistență între mediile de dezvoltare și producție. Docker împachetează aplicația cu toate dependențele sale, asigurând că ea rulează identic pe orice server compatibil. Containerul Docker al aplicației este găzduit pe o instanță EC2 din Amazon Web Services, care furnizează capacitate de calcul elastică. Amazon EC2 oferă resurse de calcul scalabile: putem lansa oricâte instanțe de servere virtuale sunt necesare și putem ajusta rapid puterea de procesare (scale-up/down) în funcție de trafic. Această soluție permite gestionarea dinamică a resurselor și evitarea limitărilor hardware fixe.
Baza de date MongoDB este găzduită separat în cloud, folosind serviciul MongoDB Atlas (Database-as-a-Service). Atlas este un serviciu complet administrat pentru MongoDB, conceput să simplifice configurarea, operarea și scalarea bazelor de date în cloud. În Atlas, multe sarcini administrative (provisionare hardware, patch-uri, configurări, backup-uri, monitorizare) sunt automatizate. De exemplu, putem modifica dimensiunea instanțelor sau adăuga noduri (shard-uri) în clusterul MongoDB fără a întrerupe aplicația, grație scalării orizontale (sharding) automate. Totodată, Atlas oferă funcționalități de înaltă disponibilitate și securitate (izolare de rețea prin VPC peering, criptare a datelor în tranzit și la repaus), ceea ce crește securitatea datelor stocate.
Am ales să separăm aplicația web de serviciul bazei de date din mai multe motive strategice (scalabilitate, securitate, flexibilitate). Arhitectura modulară în stil microserviciu permite scalarea independentă a componentelor: de exemplu, putem mări oricând numărul de instanțe EC2 pentru logica aplicației fără a altera baza de date, și invers. MongoDB Atlas, aflat într-un VPC dedicat, asigură izolarea rețelei și criptarea datelor la nivel înalt, reducând expunerea directă a bazei de date pe internet. Utilizând două servicii specializate (EC2 pentru aplicație și Atlas pentru stocarea datelor) fiecare echipă poate alege instrumentul potrivit pentru sarcina respectivă. Separarea clară ușurează și mentenanța/extinderea sistemului: putem actualiza sau extinde fiecare serviciu independent, iar procese precum integrarea continuă (CI/CD) facilitează implementarea rapidă a schimbărilor. Astfel, soluția multi-cloud oferă un sistem flexibil, securizat și ușor de scalat pe măsura creșterii numărului de utilizatori.




Instanta EC2 si Git Bash cu comenzile din Docker pentru deploy



Referinte:

 Socket.IO – Comunicare bidirecțională în timp real între client și server:
 
https://socket.io/docs/v4/

 JSON Web Token (JWT) – Autentificare și transmitere sigură a informațiilor:
 
https://jwt.io/introduction

 MongoDB – Bază de date NoSQL orientată pe documente:
 
https://www.mongodb.com/docs/

Amazon EC2 (Elastic Compute Cloud) – Serviciu AWS pentru capacitate de calcul scalabilă:

https://docs.aws.amazon.com/ec2/

Next.js – Framework React pentru aplicații web full-stack:

https://nextjs.org/docs




