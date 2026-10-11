# Bateria hook (texto escrito; desfecho coef salvo indicação)

## abertura

- `ab_artigo`: começa com A/O/Os/As
- `ab_artigo_nome`: A/O + nome próprio (A China, O Google, A Apple)
- `ab_artigo_comum`: A/O + substantivo comum (A empresa, O governo, O maior)
- `ab_nome_sem_artigo`: começa direto com nome próprio (Elon Musk, Trump, BYD)
- `ab_demonstrativo`: Esse/Essa/Esses/Este...
- `ab_demonst_pessoa`: Esse/Essa + tipo de pessoa (personagem anônimo)
- `ab_demonst_cara`: Esse cara / Essa mulher / Esse homem
- `ab_demonst_objeto`: Esse/Essa + coisa (empresa, marca, IA, cidade)
- `ab_um_uma`: Um/Uma + substantivo (Uma cidade, Um brasileiro)
- `ab_voce`: Você / Se você
- `ab_se_voce`: Se você...
- `ab_pais`: O Brasil/A China/Os EUA/O Japão...
- `ab_china`: A China...
- `ab_brasil`: O Brasil...
- `ab_eua`: Os EUA / Os Estados Unidos
- `ab_numero`: começa com número
- `ab_pergunta_qu`: Por que / Como / O que / Qual / Quem / Quanto
- `ab_por_que`: Por que...
- `ab_como`: Como...
- `ab_o_que`: O que...
- `ab_voce_sabia`: Você sabia / Já pensou / Sabia que (genérico)
- `ab_enquanto`: Enquanto...
- `ab_pouca_gente`: Pouca gente / Quase ninguém / Ninguém / Poucos
- `ab_existe`: Existe um/uma / Tem um/uma
- `ab_superlativo`: Uma das / Um dos / O maior / A maior / O primeiro
- `ab_uma_das`: Uma das / Um dos
- `ab_o_maior`: O maior / A maior
- `ab_em`: Em... (Em 2019, Em um, Em plena)
- `ab_tempo_atras`: Antigamente / Durante / Há X anos / Nos anos / Em 19xx
- `ab_imagina`: Imagina / Imagine
- `ab_parece`: Parece / Pode parecer
- `ab_muita_gente`: Muita gente / Todo mundo / A maioria
- `ab_pronome`: Ele/Ela/Eles
- `ab_isso`: Isso / Isto / Olha
- `ab_nem`: Nem [grande] conseguiu...
- `ab_os_as`: Os/As + plural
- `ab_tem`: Tem...

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| ab_artigo | 2491 | 30% vs 23% | 1,16 [1,09 a 1,23] | 1,46 [1,30 a 1,64] | 1,17 / 1,14 | 1,17 (n=1040) | 1,22 (n=714) | 1,08 (n=737) | ajuda (replica) |
| ab_artigo_nome | 1413 | 32% vs 24% | 1,24 [1,14 a 1,33] | 1,51 [1,32 a 1,72] | 1,24 / 1,23 | 1,27 (n=580) | 1,26 (n=405) | 1,17 (n=428) | ajuda (replica) |
| ab_artigo_comum | 1067 | 27% vs 25% | 1,06 [0,96 a 1,16] | 1,11 [0,95 a 1,29] | 1,07 / 1,05 | 1,06 (n=456) | 1,15 (n=305) | 0,96 (n=306) | sem evidência |
| ab_nome_sem_artigo | 112 | 38% vs 26% | 1,46 [1,13 a 1,81] | 1,75 [1,19 a 2,58] | 1,36 / 1,55 | 1,54 (n=48) | 1,41 (n=33) | 1,37 (n=31) | ajuda (replica) |
| ab_demonstrativo | 1450 | 22% vs 27% | 0,86 [0,78 a 0,94] | 0,75 [0,65 a 0,87] | 0,87 / 0,83 | 0,88 (n=612) | 0,84 (n=438) | 0,84 (n=400) | atrapalha (replica) |
| ab_demonst_pessoa | 744 | 24% vs 26% | 0,93 [0,81 a 1,05] | 0,88 [0,73 a 1,06] | 0,96 / 0,89 | 0,98 (n=315) | 0,92 (n=235) | 0,86 (n=194) | sem evidência |
| ab_demonst_cara | 204 | 18% vs 26% | 0,70 [0,52 a 0,93] | 0,63 [0,44 a 0,90] | 0,66 / 0,79 | 0,76 (n=87) | 0,53 (n=66) | 0,84 (n=51) | atrapalha (replica) |
| ab_demonst_objeto | 706 | 20% vs 26% | 0,78 [0,67 a 0,90] | 0,69 [0,57 a 0,84] | 0,80 / 0,75 | 0,77 (n=297) | 0,74 (n=203) | 0,83 (n=206) | atrapalha (replica) |
| ab_um_uma | 258 | 27% vs 26% | 1,05 [0,86 a 1,28] | 1,07 [0,81 a 1,42] | 1,03 / 1,06 | 1,14 (n=123) | 0,84 (n=69) | 1,12 (n=66) | sem evidência |
| ab_voce | 194 | 20% vs 26% | 0,78 [0,58 a 1,02] | 0,71 [0,50 a 1,02] | 0,70 / 0,85 | 0,85 (n=92) | 0,44 (n=53) | 1,03 (n=49) | sem evidência |
| ab_se_voce | 69 | 22% vs 26% | 0,84 [0,53 a 1,27] | 0,79 [0,44 a 1,40] | 0,65 / 0,91 | 0,80 (n=34) | 0,55 (n=21) | 1,38 (n=14) | sem evidência |
| ab_pais | 434 | 30% vs 25% | 1,18 [1,02 a 1,35] | 1,32 [1,05 a 1,66] | 1,04 / 1,33 | 1,30 (n=174) | 1,21 (n=128) | 1,00 (n=132) | ajuda (replica) |
| ab_china | 279 | 31% vs 26% | 1,20 [1,00 a 1,42] | 1,36 [1,02 a 1,82] | 1,09 / 1,33 | 1,26 (n=105) | 1,32 (n=79) | 1,02 (n=95) | sem evidência |
| ab_brasil | 105 | 20% vs 26% | 0,78 [0,52 a 1,11] | 0,72 [0,44 a 1,16] | 0,87 / 0,69 | 1,02 (n=46) | 0,82 (n=33) | 0,30 (n=26) | sem evidência |
| ab_eua | 26 | 27% vs 26% | 1,04 [0,53 a 1,79] | 1,04 [0,44 a 2,48] | 0,97 / 1,11 | 0,97 (n=12) | 0,48 (n=8) | 1,94 (n=6) | amostra pequena |
| ab_numero | 85 | 29% vs 26% | 1,14 [0,81 a 1,54] | 1,20 [0,75 a 1,93] | 1,02 / 1,34 | 0,94 (n=33) | 1,72 (n=27) | 0,77 (n=25) | sem evidência |
| ab_pergunta_qu | 177 | 29% vs 26% | 1,14 [0,90 a 1,42] | 1,22 [0,87 a 1,71] | 1,27 / 1,08 | 0,96 (n=69) | 1,06 (n=51) | 1,43 (n=57) | sem evidência |
| ab_por_que | 84 | 31% vs 26% | 1,20 [0,86 a 1,61] | 1,32 [0,82 a 2,15] | 1,37 / 1,16 | 0,72 (n=27) | 1,03 (n=30) | 1,87 (n=27) | sem evidência |
| ab_como | 38 | 18% vs 26% | 0,71 [0,36 a 1,30] | 0,65 [0,28 a 1,47] | 0,74 / 0,69 | 0,24 (n=16) | 1,06 (n=11) | 1,06 (n=11) | sem evidência |
| ab_o_que | 43 | 37% vs 26% | 1,44 [0,95 a 2,02] | 1,77 [0,94 a 3,34] | 1,66 / 1,34 | 1,75 (n=20) | 1,11 (n=7) | 1,21 (n=16) | sem evidência |
| ab_voce_sabia | 13 | 23% vs 26% | 0,90 [0,32 a 1,95] | 0,85 [0,23 a 3,10] | 0,86 / 0,97 | 2,33 (n=5) | 0,00 (n=4) | 0,00 (n=4) | amostra pequena |
| ab_enquanto | 220 | 24% vs 26% | 0,93 [0,73 a 1,17] | 0,91 [0,66 a 1,25] | 0,70 / 1,27 | 1,02 (n=88) | 0,95 (n=69) | 0,80 (n=63) | sem evidência |
| ab_pouca_gente | 84 | 25% vs 26% | 0,97 [0,66 a 1,37] | 0,96 [0,58 a 1,58] | 1,26 / 0,71 | 0,83 (n=33) | 0,86 (n=27) | 1,29 (n=24) | sem evidência |
| ab_existe | 90 | 19% vs 26% | 0,73 [0,47 a 1,09] | 0,66 [0,39 a 1,13] | 0,53 / 0,83 | 0,58 (n=40) | 1,04 (n=26) | 0,65 (n=24) | sem evidência |
| ab_superlativo | 210 | 25% vs 26% | 0,96 [0,75 a 1,20] | 0,94 [0,68 a 1,30] | 0,83 / 1,09 | 0,81 (n=86) | 1,00 (n=62) | 1,12 (n=62) | sem evidência |
| ab_uma_das | 86 | 33% vs 26% | 1,26 [0,92 a 1,67] | 1,40 [0,88 a 2,22] | 1,02 / 1,46 | 0,89 (n=35) | 1,15 (n=27) | 1,94 (n=24) | sem evidência |
| ab_o_maior | 113 | 20% vs 26% | 0,79 [0,54 a 1,11] | 0,73 [0,46 a 1,16] | 0,71 / 0,88 | 0,73 (n=48) | 1,00 (n=31) | 0,68 (n=34) | sem evidência |
| ab_em | 82 | 11% vs 26% | 0,43 [0,23 a 0,76] | 0,35 [0,18 a 0,71] | 0,61 / 0,26 | 0,32 (n=36) | 0,48 (n=24) | 0,53 (n=22) | atrapalha (replica) |
| ab_tempo_atras | 111 | 18% vs 26% | 0,70 [0,46 a 1,02] | 0,63 [0,39 a 1,03] | 0,86 / 0,40 | 0,66 (n=47) | 0,27 (n=29) | 1,11 (n=35) | sem evidência |
| ab_imagina | 26 | 19% vs 26% | 0,75 [0,33 a 1,47] | 0,68 [0,26 a 1,83] | 0,91 / 0,43 | 0,26 (n=15) | 1,29 (n=6) | 1,55 (n=5) | amostra pequena |
| ab_parece | 42 | 29% vs 26% | 1,11 [0,67 a 1,69] | 1,15 [0,59 a 2,25] | 2,15 / 0,82 | 1,70 (n=16) | 1,11 (n=14) | 0,32 (n=12) | sem evidência |
| ab_muita_gente | 64 | 13% vs 26% | 0,49 [0,25 a 0,88] | 0,41 [0,20 a 0,87] | 0,41 / 0,60 | 0,75 (n=26) | 0,64 (n=18) | 0,00 (n=20) | atrapalha (replica) |
| ab_pronome | 114 | 23% vs 26% | 0,88 [0,62 a 1,22] | 0,84 [0,54 a 1,32] | 0,94 / 0,82 | 0,89 (n=48) | 0,99 (n=39) | 0,72 (n=27) | sem evidência |
| ab_isso | 74 | 20% vs 26% | 0,79 [0,49 a 1,19] | 0,71 [0,40 a 1,27] | 0,89 / 0,73 | 0,78 (n=25) | 0,77 (n=25) | 0,81 (n=24) | sem evidência |
| ab_nem | 9 | 89% vs 26% | 3,45 [2,19 a 3,80] | 23,91 [2,97 a 192,76] | - / 3,45 | 3,89 (n=3) | 2,58 (n=3) | 3,87 (n=3) | amostra pequena |
| ab_os_as | 171 | 20% vs 26% | 0,79 [0,59 a 1,05] | 0,74 [0,50 a 1,07] | 0,83 / 0,76 | 1,00 (n=66) | 0,55 (n=56) | 0,79 (n=49) | sem evidência |
| ab_tem | 51 | 14% vs 26% | 0,53 [0,26 a 1,00] | 0,45 [0,20 a 1,00] | 0,39 / 0,57 | 0,32 (n=24) | 0,77 (n=15) | 0,65 (n=12) | atrapalha (replica) |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| ab_artigo | 2491 | 42% vs 37% | 1,07 [1,03 a 1,12] | 1,24 [1,11 a 1,39] | 1,09 / 1,06 | 1,05 (n=1040) | 1,12 (n=714) | 1,06 (n=737) | ajuda (replica) |
| ab_artigo_nome | 1413 | 45% vs 38% | 1,14 [1,07 a 1,21] | 1,32 [1,16 a 1,50] | 1,14 / 1,13 | 1,13 (n=580) | 1,17 (n=405) | 1,12 (n=428) | ajuda (replica) |
| ab_artigo_comum | 1067 | 39% vs 39% | 0,99 [0,91 a 1,06] | 1,01 [0,88 a 1,17] | 0,99 / 0,98 | 0,95 (n=456) | 1,04 (n=305) | 0,99 (n=306) | sem evidência |
| ab_nome_sem_artigo | 112 | 43% vs 39% | 1,10 [0,87 a 1,33] | 1,43 [0,97 a 2,12] | 0,73 / 1,51 | 1,26 (n=48) | 1,03 (n=33) | 0,92 (n=31) | sem evidência |
| ab_demonstrativo | 1450 | 37% vs 40% | 0,94 [0,88 a 1,01] | 0,87 [0,77 a 1,00] | 0,94 / 0,93 | 0,98 (n=612) | 0,88 (n=438) | 0,96 (n=400) | sem evidência |
| ab_demonst_pessoa | 744 | 39% vs 39% | 1,01 [0,92 a 1,10] | 0,99 [0,84 a 1,18] | 1,05 / 0,96 | 1,03 (n=315) | 0,99 (n=235) | 0,99 (n=194) | sem evidência |
| ab_demonst_cara | 204 | 33% vs 39% | 0,84 [0,68 a 1,01] | 0,91 [0,67 a 1,24] | 0,89 / 0,70 | 0,91 (n=87) | 0,63 (n=66) | 1,01 (n=51) | sem evidência |
| ab_demonst_objeto | 706 | 34% vs 40% | 0,87 [0,79 a 0,96] | 0,80 [0,67 a 0,95] | 0,84 / 0,90 | 0,92 (n=297) | 0,76 (n=203) | 0,93 (n=206) | atrapalha (replica) |
| ab_um_uma | 258 | 38% vs 39% | 0,96 [0,82 a 1,12] | 1,00 [0,77 a 1,32] | 1,25 / 0,81 | 1,05 (n=123) | 0,88 (n=69) | 0,90 (n=66) | sem evidência |
| ab_voce | 194 | 34% vs 39% | 0,87 [0,71 a 1,05] | 0,82 [0,59 a 1,12] | 0,88 / 0,87 | 1,00 (n=92) | 0,60 (n=53) | 0,95 (n=49) | sem evidência |
| ab_se_voce | 69 | 33% vs 39% | 0,85 [0,60 a 1,15] | 0,82 [0,48 a 1,38] | 0,68 / 0,94 | 1,01 (n=34) | 0,58 (n=21) | 0,92 (n=14) | sem evidência |
| ab_pais | 434 | 51% vs 38% | 1,30 [1,18 a 1,42] | 1,40 [1,13 a 1,73] | 1,25 / 1,36 | 1,29 (n=174) | 1,31 (n=128) | 1,31 (n=132) | ajuda (replica) |
| ab_china | 279 | 56% vs 38% | 1,43 [1,28 a 1,58] | 1,52 [1,16 a 2,00] | 1,40 / 1,46 | 1,38 (n=105) | 1,48 (n=79) | 1,44 (n=95) | ajuda (replica) |
| ab_brasil | 105 | 32% vs 39% | 0,83 [0,62 a 1,07] | 0,77 [0,51 a 1,17] | 0,95 / 0,72 | 0,97 (n=46) | 0,81 (n=33) | 0,60 (n=26) | sem evidência |
| ab_eua | 26 | 38% vs 39% | 0,98 [0,57 a 1,47] | 1,09 [0,46 a 2,63] | 0,61 / 1,34 | 0,88 (n=12) | 0,91 (n=8) | 1,29 (n=6) | amostra pequena |
| ab_numero | 85 | 46% vs 39% | 1,17 [0,91 a 1,44] | 1,09 [0,70 a 1,68] | 0,97 / 1,50 | 1,12 (n=33) | 1,44 (n=27) | 0,93 (n=25) | sem evidência |
| ab_pergunta_qu | 177 | 44% vs 39% | 1,13 [0,95 a 1,32] | 1,16 [0,84 a 1,61] | 0,93 / 1,26 | 0,84 (n=69) | 1,48 (n=51) | 1,13 (n=57) | sem evidência |
| ab_por_que | 84 | 48% vs 39% | 1,22 [0,95 a 1,49] | 1,14 [0,71 a 1,82] | 0,72 / 1,40 | 0,78 (n=27) | 1,62 (n=30) | 1,15 (n=27) | sem evidência |
| ab_como | 38 | 26% vs 39% | 0,67 [0,38 a 1,07] | 0,73 [0,33 a 1,59] | 0,58 / 0,79 | 0,33 (n=16) | 0,89 (n=11) | 0,94 (n=11) | sem evidência |
| ab_o_que | 43 | 51% vs 39% | 1,31 [0,94 a 1,67] | 1,53 [0,81 a 2,87] | 1,40 / 1,29 | 1,32 (n=20) | 1,39 (n=7) | 1,29 (n=16) | sem evidência |
| ab_voce_sabia | 13 | 38% vs 39% | 0,98 [0,45 a 1,65] | 1,72 [0,50 a 5,93] | 1,09 / 0,67 | 1,58 (n=5) | 0,61 (n=4) | 0,65 (n=4) | amostra pequena |
| ab_enquanto | 220 | 42% vs 39% | 1,07 [0,91 a 1,24] | 1,04 [0,78 a 1,38] | 1,05 / 1,08 | 1,14 (n=88) | 1,02 (n=69) | 1,02 (n=63) | sem evidência |
| ab_pouca_gente | 84 | 39% vs 39% | 1,01 [0,76 a 1,28] | 1,18 [0,75 a 1,87] | 0,98 / 1,03 | 1,04 (n=33) | 0,81 (n=27) | 1,18 (n=24) | sem evidência |
| ab_existe | 90 | 24% vs 39% | 0,63 [0,43 a 0,88] | 0,57 [0,35 a 0,94] | 0,34 / 0,79 | 0,46 (n=40) | 0,75 (n=26) | 0,75 (n=24) | atrapalha (replica) |
| ab_superlativo | 210 | 34% vs 39% | 0,87 [0,71 a 1,03] | 0,97 [0,72 a 1,32] | 0,88 / 0,85 | 0,67 (n=86) | 0,94 (n=62) | 1,04 (n=62) | sem evidência |
| ab_uma_das | 86 | 38% vs 39% | 0,98 [0,74 a 1,25] | 1,42 [0,89 a 2,26] | 0,97 / 1,00 | 0,60 (n=35) | 0,99 (n=27) | 1,51 (n=24) | sem evidência |
| ab_o_maior | 113 | 31% vs 39% | 0,79 [0,59 a 1,02] | 0,75 [0,49 a 1,15] | 0,78 / 0,81 | 0,71 (n=48) | 0,94 (n=31) | 0,76 (n=34) | sem evidência |
| ab_em | 82 | 28% vs 39% | 0,72 [0,50 a 0,99] | 0,61 [0,37 a 1,02] | 0,65 / 0,79 | 0,51 (n=36) | 1,22 (n=24) | 0,47 (n=22) | sinal sem replicação |
| ab_tempo_atras | 111 | 35% vs 39% | 0,90 [0,69 a 1,14] | 0,88 [0,59 a 1,33] | 0,99 / 0,69 | 0,84 (n=47) | 1,01 (n=29) | 0,89 (n=35) | sem evidência |
| ab_imagina | 26 | 27% vs 39% | 0,69 [0,35 a 1,18] | 0,67 [0,29 a 1,56] | 0,72 / 0,59 | 0,35 (n=15) | 1,22 (n=6) | 1,03 (n=5) | amostra pequena |
| ab_parece | 42 | 52% vs 39% | 1,34 [0,97 a 1,71] | 1,25 [0,67 a 2,32] | 1,36 / 1,38 | 1,48 (n=16) | 1,56 (n=14) | 0,86 (n=12) | sem evidência |
| ab_muita_gente | 64 | 31% vs 39% | 0,80 [0,54 a 1,11] | 0,71 [0,41 a 1,24] | 0,58 / 1,13 | 0,91 (n=26) | 0,81 (n=18) | 0,65 (n=20) | sem evidência |
| ab_pronome | 114 | 32% vs 39% | 0,83 [0,63 a 1,06] | 0,95 [0,63 a 1,43] | 0,75 / 0,93 | 0,99 (n=48) | 0,75 (n=39) | 0,67 (n=27) | sem evidência |
| ab_isso | 74 | 46% vs 39% | 1,18 [0,90 a 1,46] | 0,87 [0,53 a 1,43] | 1,32 / 1,11 | 1,48 (n=25) | 0,97 (n=25) | 1,08 (n=24) | sem evidência |
| ab_nem | 9 | 78% vs 39% | 1,99 [1,16 a 2,40] | 4,21 [0,85 a 20,80] | - / 2,08 | 2,64 (n=3) | 2,43 (n=3) | 0,86 (n=3) | amostra pequena |
| ab_os_as | 171 | 32% vs 39% | 0,81 [0,64 a 1,00] | 0,73 [0,52 a 1,04] | 0,69 / 0,95 | 1,00 (n=66) | 0,61 (n=56) | 0,79 (n=49) | sinal sem replicação |
| ab_tem | 51 | 22% vs 39% | 0,55 [0,32 a 0,89] | 0,45 [0,23 a 0,91] | 0,49 / 0,59 | 0,44 (n=24) | 0,65 (n=15) | 0,65 (n=12) | atrapalha (replica) |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| ab_artigo | 536 | 28% vs 23% | 1,12 [0,98 a 1,28] | 1,33 [1,03 a 1,73] | 1,19 / 1,02 | 1,12 (n=536) | sem evidência |
| ab_artigo_nome | 290 | 34% vs 23% | 1,36 [1,15 a 1,59] | 1,83 [1,37 a 2,45] | 1,44 / 1,24 | 1,36 (n=290) | ajuda (replica) |
| ab_artigo_comum | 242 | 21% vs 26% | 0,84 [0,65 a 1,06] | 0,74 [0,52 a 1,04] | 0,86 / 0,80 | 0,84 (n=242) | sem evidência |
| ab_nome_sem_artigo | 30 | 40% vs 25% | 1,60 [0,98 a 2,30] | 2,06 [0,98 a 4,35] | 2,03 / 1,06 | 1,60 (n=30) | sem evidência |
| ab_demonstrativo | 296 | 19% vs 27% | 0,75 [0,59 a 0,95] | 0,63 [0,45 a 0,88] | 0,74 / 0,85 | 0,75 (n=296) | atrapalha (replica) |
| ab_demonst_pessoa | 145 | 26% vs 25% | 1,02 [0,76 a 1,32] | 1,07 [0,70 a 1,63] | 1,03 / 1,03 | 1,02 (n=145) | sem evidência |
| ab_demonst_cara | 55 | 22% vs 25% | 0,87 [0,52 a 1,37] | 0,82 [0,42 a 1,59] | 0,77 / 1,38 | 0,87 (n=55) | sem evidência |
| ab_demonst_objeto | 151 | 13% vs 27% | 0,50 [0,33 a 0,75] | 0,41 [0,25 a 0,67] | 0,48 / 0,63 | 0,50 (n=151) | atrapalha (replica) |
| ab_um_uma | 50 | 32% vs 25% | 1,28 [0,83 a 1,83] | 1,44 [0,78 a 2,66] | 0,98 / 1,35 | 1,28 (n=50) | sem evidência |
| ab_voce | 43 | 30% vs 25% | 1,21 [0,74 a 1,80] | 1,27 [0,65 a 2,48] | 1,56 / 0,77 | 1,21 (n=43) | sem evidência |
| ab_se_voce | 13 | 23% vs 25% | 0,92 [0,33 a 2,00] | 0,86 [0,23 a 3,20] | 1,44 / 0,49 | 0,92 (n=13) | amostra pequena |
| ab_pais | 54 | 46% vs 24% | 1,85 [1,34 a 2,37] | 2,82 [1,59 a 4,98] | 1,87 / 1,72 | 1,85 (n=54) | ajuda (replica) |
| ab_china | 22 | 55% vs 25% | 2,18 [1,38 a 2,91] | 4,03 [1,68 a 9,62] | 2,02 / 2,46 | 2,18 (n=22) | ajuda (replica) |
| ab_brasil | 22 | 32% vs 25% | 1,27 [0,65 a 2,10] | 1,36 [0,54 a 3,42] | 1,80 / 0,69 | 1,27 (n=22) | sem evidência |
| ab_eua | 4 | 50% vs 25% | 1,99 [0,60 a 3,39] | 2,69 [0,36 a 19,81] | 2,16 / 1,72 | 1,99 (n=4) | amostra pequena |
| ab_numero | 22 | 14% vs 25% | 0,54 [0,19 a 1,33] | 0,48 [0,14 a 1,61] | 0,24 / 1,72 | 0,54 (n=22) | sem evidência |
| ab_pergunta_qu | 27 | 22% vs 25% | 0,89 [0,42 a 1,63] | 0,81 [0,32 a 2,04] | 1,30 / 0,00 | 0,89 (n=27) | sem evidência |
| ab_por_que | 6 | 50% vs 25% | 1,99 [0,75 a 3,24] | 2,81 [0,59 a 13,40] | 2,16 / - | 1,99 (n=6) | amostra pequena |
| ab_como | 6 | 33% vs 25% | 1,33 [0,39 a 2,79] | 1,34 [0,23 a 7,69] | 1,44 / - | 1,33 (n=6) | amostra pequena |
| ab_o_que | 11 | 9% vs 25% | 0,36 [0,06 a 1,50] | 0,27 [0,03 a 2,22] | 0,86 / 0,00 | 0,36 (n=11) | amostra pequena |
| ab_voce_sabia | 4 | 25% vs 25% | 1,00 [0,18 a 2,79] | 0,94 [0,09 a 9,63] | 1,44 / 0,00 | 1,00 (n=4) | amostra pequena |
| ab_enquanto | 38 | 21% vs 25% | 0,84 [0,44 a 1,45] | 0,80 [0,36 a 1,76] | 0,83 / 0,86 | 0,84 (n=38) | sem evidência |
| ab_pouca_gente | 18 | 28% vs 25% | 1,11 [0,50 a 2,03] | 1,09 [0,38 a 3,14] | 1,18 / 0,98 | 1,11 (n=18) | amostra pequena |
| ab_existe | 21 | 19% vs 25% | 0,76 [0,31 a 1,60] | 0,66 [0,22 a 2,00] | 0,79 / 0,69 | 0,76 (n=21) | sem evidência |
| ab_superlativo | 52 | 17% vs 25% | 0,69 [0,37 a 1,19] | 0,56 [0,27 a 1,18] | 0,47 / 1,15 | 0,69 (n=52) | sem evidência |
| ab_uma_das | 20 | 20% vs 25% | 0,80 [0,32 a 1,66] | 0,66 [0,21 a 2,02] | 0,66 / 0,98 | 0,80 (n=20) | sem evidência |
| ab_o_maior | 31 | 13% vs 25% | 0,51 [0,20 a 1,15] | 0,41 [0,14 a 1,18] | 0,19 / 1,29 | 0,51 (n=31) | sem evidência |
| ab_em | 21 | 14% vs 25% | 0,57 [0,20 a 1,38] | 0,47 [0,14 a 1,63] | 0,79 / 0,34 | 0,57 (n=21) | sem evidência |
| ab_tempo_atras | 33 | 21% vs 25% | 0,85 [0,43 a 1,51] | 0,82 [0,35 a 1,91] | 0,79 / 0,94 | 0,85 (n=33) | sem evidência |
| ab_imagina | 8 | 25% vs 25% | 1,00 [0,29 a 2,36] | 1,01 [0,21 a 4,93] | 0,86 / 1,15 | 1,00 (n=8) | amostra pequena |
| ab_parece | 5 | 20% vs 25% | 0,80 [0,14 a 2,49] | 0,71 [0,08 a 6,24] | 0,00 / 1,72 | 0,80 (n=5) | amostra pequena |
| ab_muita_gente | 22 | 23% vs 25% | 0,91 [0,40 a 1,73] | 0,86 [0,31 a 2,34] | 0,86 / 0,98 | 0,91 (n=22) | sem evidência |
| ab_pronome | 20 | 25% vs 25% | 1,00 [0,45 a 1,87] | 0,94 [0,34 a 2,62] | 0,66 / 1,48 | 1,00 (n=20) | sem evidência |
| ab_isso | 10 | 60% vs 25% | 2,39 [1,25 a 3,32] | 4,69 [1,32 a 16,70] | 2,47 / 2,30 | 2,39 (n=10) | amostra pequena |
| ab_nem | 0 | - vs 25% | - [0,00 a 3,99] | - [- a -] | - / - | - (n=0) | amostra pequena |
| ab_os_as | 37 | 19% vs 25% | 0,75 [0,38 a 1,36] | 0,68 [0,29 a 1,59] | 0,98 / 0,46 | 0,75 (n=37) | sem evidência |
| ab_tem | 12 | 42% vs 25% | 1,66 [0,77 a 2,71] | 2,00 [0,63 a 6,39] | 0,00 / 1,91 | 1,66 (n=12) | amostra pequena |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| ab_artigo | 535 | 28% vs 24% | 1,09 [0,95 a 1,25] | 1,25 [0,96 a 1,62] | 1,06 / 1,16 | 1,09 (n=535) | sem evidência |
| ab_artigo_nome | 290 | 30% vs 24% | 1,19 [0,99 a 1,41] | 1,39 [1,04 a 1,87] | 1,17 / 1,24 | 1,19 (n=290) | sem evidência |
| ab_artigo_comum | 241 | 24% vs 26% | 0,96 [0,76 a 1,19] | 0,93 [0,67 a 1,30] | 0,91 / 1,04 | 0,96 (n=241) | sem evidência |
| ab_nome_sem_artigo | 30 | 50% vs 25% | 1,96 [1,30 a 2,62] | 3,09 [1,48 a 6,45] | 2,19 / 1,64 | 1,96 (n=30) | ajuda (replica) |
| ab_demonstrativo | 295 | 19% vs 27% | 0,73 [0,57 a 0,92] | 0,57 [0,41 a 0,81] | 0,78 / 0,63 | 0,73 (n=295) | atrapalha (replica) |
| ab_demonst_pessoa | 144 | 19% vs 26% | 0,76 [0,54 a 1,05] | 0,65 [0,42 a 1,03] | 0,83 / 0,62 | 0,76 (n=144) | sem evidência |
| ab_demonst_cara | 54 | 11% vs 26% | 0,44 [0,20 a 0,87] | 0,35 [0,15 a 0,82] | 0,38 / 0,71 | 0,44 (n=54) | atrapalha (replica) |
| ab_demonst_objeto | 151 | 18% vs 26% | 0,70 [0,49 a 0,97] | 0,60 [0,39 a 0,93] | 0,74 / 0,65 | 0,70 (n=151) | atrapalha (replica) |
| ab_um_uma | 50 | 30% vs 25% | 1,18 [0,75 a 1,72] | 1,26 [0,68 a 2,35] | 0,75 / 1,40 | 1,18 (n=50) | sem evidência |
| ab_voce | 43 | 30% vs 25% | 1,19 [0,73 a 1,77] | 1,28 [0,66 a 2,49] | 1,16 / 1,19 | 1,19 (n=43) | sem evidência |
| ab_se_voce | 13 | 31% vs 25% | 1,21 [0,50 a 2,26] | 1,31 [0,40 a 4,35] | 1,38 / 1,02 | 1,21 (n=13) | amostra pequena |
| ab_pais | 54 | 31% vs 25% | 1,23 [0,81 a 1,76] | 1,38 [0,76 a 2,54] | 0,83 / 1,63 | 1,23 (n=54) | sem evidência |
| ab_china | 22 | 27% vs 25% | 1,07 [0,52 a 1,89] | 1,09 [0,42 a 2,83] | 0,55 / 2,03 | 1,07 (n=22) | sem evidência |
| ab_brasil | 22 | 23% vs 26% | 0,89 [0,40 a 1,70] | 0,86 [0,31 a 2,38] | 1,03 / 0,71 | 0,89 (n=22) | sem evidência |
| ab_eua | 4 | 50% vs 25% | 1,96 [0,59 a 3,33] | 3,03 [0,41 a 22,41] | 2,07 / 1,78 | 1,96 (n=4) | amostra pequena |
| ab_numero | 22 | 23% vs 26% | 0,89 [0,40 a 1,70] | 0,86 [0,32 a 2,33] | 0,69 / 1,78 | 0,89 (n=22) | sem evidência |
| ab_pergunta_qu | 27 | 15% vs 26% | 0,58 [0,23 a 1,27] | 0,50 [0,17 a 1,46] | 0,41 / 1,02 | 0,58 (n=27) | sem evidência |
| ab_por_que | 6 | 0% vs 26% | 0,00 [0,00 a 1,53] | - [- a -] | 0,00 / - | 0,00 (n=6) | amostra pequena |
| ab_como | 6 | 0% vs 26% | 0,00 [0,00 a 1,53] | - [- a -] | 0,00 / - | 0,00 (n=6) | amostra pequena |
| ab_o_que | 11 | 18% vs 26% | 0,71 [0,20 a 1,87] | 0,64 [0,14 a 2,95] | 0,00 / 1,19 | 0,71 (n=11) | amostra pequena |
| ab_voce_sabia | 4 | 25% vs 25% | 0,98 [0,18 a 2,74] | 0,97 [0,10 a 9,46] | 1,38 / 0,00 | 0,98 (n=4) | amostra pequena |
| ab_enquanto | 38 | 29% vs 25% | 1,14 [0,67 a 1,76] | 1,20 [0,58 a 2,45] | 1,27 / 0,89 | 1,14 (n=38) | sem evidência |
| ab_pouca_gente | 18 | 22% vs 26% | 0,87 [0,35 a 1,77] | 0,84 [0,27 a 2,61] | 1,13 / 0,51 | 0,87 (n=18) | amostra pequena |
| ab_existe | 21 | 29% vs 25% | 1,12 [0,54 a 1,96] | 1,16 [0,45 a 2,99] | 1,13 / 1,07 | 1,12 (n=21) | sem evidência |
| ab_superlativo | 52 | 17% vs 26% | 0,68 [0,37 a 1,17] | 0,60 [0,29 a 1,24] | 0,67 / 0,71 | 0,68 (n=52) | sem evidência |
| ab_uma_das | 20 | 20% vs 26% | 0,78 [0,32 a 1,63] | 0,72 [0,24 a 2,20] | 0,95 / 0,51 | 0,78 (n=20) | sem evidência |
| ab_o_maior | 31 | 13% vs 26% | 0,51 [0,20 a 1,13] | 0,42 [0,15 a 1,22] | 0,36 / 0,89 | 0,51 (n=31) | sem evidência |
| ab_em | 21 | 24% vs 26% | 0,93 [0,42 a 1,77] | 0,90 [0,33 a 2,50] | 1,50 / 0,36 | 0,93 (n=21) | sem evidência |
| ab_tempo_atras | 33 | 21% vs 26% | 0,83 [0,42 a 1,48] | 0,78 [0,34 a 1,82] | 1,13 / 0,32 | 0,83 (n=33) | sem evidência |
| ab_imagina | 8 | 25% vs 25% | 0,98 [0,28 a 2,32] | 0,98 [0,20 a 4,88] | 0,83 / 1,19 | 0,98 (n=8) | amostra pequena |
| ab_parece | 5 | 40% vs 25% | 1,57 [0,46 a 3,02] | 1,96 [0,33 a 11,81] | 0,00 / 3,56 | 1,57 (n=5) | amostra pequena |
| ab_muita_gente | 22 | 27% vs 25% | 1,07 [0,52 a 1,89] | 1,10 [0,43 a 2,83] | 1,10 / 1,02 | 1,07 (n=22) | sem evidência |
| ab_pronome | 20 | 25% vs 26% | 0,98 [0,44 a 1,84] | 0,96 [0,34 a 2,67] | 0,64 / 1,52 | 0,98 (n=20) | sem evidência |
| ab_isso | 10 | 50% vs 25% | 1,96 [0,93 a 2,99] | 3,05 [0,86 a 10,86] | 1,77 / 2,37 | 1,96 (n=10) | amostra pequena |
| ab_nem | 0 | - vs 25% | - [0,00 a 3,92] | - [- a -] | - / - | - (n=0) | amostra pequena |
| ab_os_as | 37 | 19% vs 26% | 0,74 [0,37 a 1,34] | 0,67 [0,29 a 1,56] | 0,94 / 0,47 | 0,74 (n=37) | sem evidência |
| ab_tem | 12 | 42% vs 25% | 1,63 [0,76 a 2,67] | 2,08 [0,66 a 6,60] | 0,00 / 1,98 | 1,63 (n=12) | amostra pequena |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| ab_artigo | 2377 | 29% vs 24% | 1,13 [1,06 a 1,20] | 1,36 [1,20 a 1,53] | 1,13 / 1,13 | 1,11 (n=980) | 1,24 (n=681) | 1,06 (n=716) | ajuda (replica) |
| ab_artigo_nome | 1234 | 31% vs 24% | 1,19 [1,10 a 1,30] | 1,39 [1,21 a 1,60] | 1,20 / 1,19 | 1,19 (n=518) | 1,28 (n=371) | 1,11 (n=345) | ajuda (replica) |
| ab_artigo_comum | 1141 | 27% vs 25% | 1,06 [0,96 a 1,16] | 1,11 [0,96 a 1,29] | 1,05 / 1,07 | 1,02 (n=461) | 1,18 (n=310) | 1,01 (n=370) | sem evidência |
| ab_nome_sem_artigo | 141 | 40% vs 25% | 1,57 [1,27 a 1,89] | 1,98 [1,41 a 2,79] | 1,40 / 1,79 | 1,54 (n=73) | 1,17 (n=37) | 2,12 (n=31) | ajuda (replica) |
| ab_demonstrativo | 1321 | 22% vs 27% | 0,87 [0,79 a 0,96] | 0,78 [0,67 a 0,90] | 0,93 / 0,82 | 0,94 (n=537) | 0,82 (n=412) | 0,83 (n=372) | atrapalha (replica) |
| ab_demonst_pessoa | 672 | 23% vs 26% | 0,90 [0,78 a 1,03] | 0,84 [0,69 a 1,02] | 0,96 / 0,85 | 0,98 (n=268) | 0,85 (n=222) | 0,85 (n=182) | sem evidência |
| ab_demonst_cara | 175 | 16% vs 26% | 0,62 [0,44 a 0,86] | 0,54 [0,36 a 0,81] | 0,63 / 0,61 | 0,71 (n=65) | 0,38 (n=62) | 0,80 (n=48) | atrapalha (replica) |
| ab_demonst_objeto | 649 | 22% vs 26% | 0,84 [0,73 a 0,97] | 0,78 [0,64 a 0,94] | 0,90 / 0,76 | 0,91 (n=269) | 0,79 (n=190) | 0,81 (n=190) | atrapalha (replica) |
| ab_um_uma | 219 | 29% vs 26% | 1,14 [0,92 a 1,38] | 1,20 [0,89 a 1,62] | 1,18 / 1,12 | 1,25 (n=105) | 0,88 (n=58) | 1,17 (n=56) | sem evidência |
| ab_voce | 202 | 19% vs 26% | 0,75 [0,56 a 0,98] | 0,68 [0,47 a 0,97] | 0,70 / 0,80 | 0,84 (n=97) | 0,45 (n=53) | 0,89 (n=52) | atrapalha (replica) |
| ab_se_voce | 66 | 24% vs 26% | 0,94 [0,60 a 1,39] | 0,92 [0,52 a 1,62] | 0,78 / 0,99 | 0,85 (n=32) | 0,59 (n=20) | 1,65 (n=14) | sem evidência |
| ab_pais | 409 | 29% vs 25% | 1,13 [0,97 a 1,31] | 1,22 [0,96 a 1,54] | 0,98 / 1,28 | 1,20 (n=158) | 1,23 (n=125) | 0,95 (n=126) | sem evidência |
| ab_china | 264 | 29% vs 26% | 1,12 [0,92 a 1,34] | 1,19 [0,89 a 1,61] | 0,98 / 1,28 | 1,17 (n=96) | 1,28 (n=77) | 0,93 (n=91) | sem evidência |
| ab_brasil | 98 | 20% vs 26% | 0,79 [0,53 a 1,14] | 0,74 [0,45 a 1,21] | 0,93 / 0,69 | 0,92 (n=42) | 0,98 (n=32) | 0,32 (n=24) | sem evidência |
| ab_eua | 26 | 27% vs 26% | 1,05 [0,53 a 1,79] | 1,06 [0,45 a 2,54] | 0,97 / 1,11 | 0,97 (n=12) | 0,49 (n=8) | 1,93 (n=6) | amostra pequena |
| ab_numero | 81 | 32% vs 26% | 1,25 [0,89 a 1,67] | 1,37 [0,85 a 2,19] | 1,11 / 1,39 | 1,11 (n=35) | 1,75 (n=27) | 0,81 (n=19) | sem evidência |
| ab_pergunta_qu | 178 | 30% vs 26% | 1,18 [0,94 a 1,46] | 1,29 [0,92 a 1,79] | 1,32 / 1,10 | 0,88 (n=70) | 1,23 (n=48) | 1,48 (n=60) | sem evidência |
| ab_por_que | 77 | 34% vs 26% | 1,31 [0,94 a 1,74] | 1,51 [0,92 a 2,48] | 1,46 / 1,27 | 0,77 (n=25) | 1,02 (n=27) | 2,16 (n=25) | sem evidência |
| ab_como | 40 | 20% vs 26% | 0,78 [0,41 a 1,35] | 0,72 [0,33 a 1,57] | 0,78 / 0,78 | 0,23 (n=17) | 1,43 (n=11) | 0,96 (n=12) | sem evidência |
| ab_o_que | 37 | 38% vs 26% | 1,47 [0,94 a 2,09] | 1,85 [0,94 a 3,66] | 1,50 / 1,46 | 1,43 (n=19) | 1,97 (n=4) | 1,38 (n=14) | sem evidência |
| ab_voce_sabia | 22 | 18% vs 26% | 0,71 [0,28 a 1,50] | 0,63 [0,21 a 1,87] | 0,83 / 0,49 | 1,72 (n=9) | 0,00 (n=6) | 0,00 (n=7) | amostra pequena |
| ab_enquanto | 190 | 25% vs 26% | 0,96 [0,74 a 1,22] | 0,94 [0,67 a 1,33] | 0,69 / 1,31 | 1,02 (n=76) | 0,98 (n=60) | 0,86 (n=54) | sem evidência |
| ab_pouca_gente | 73 | 21% vs 26% | 0,80 [0,50 a 1,21] | 0,74 [0,42 a 1,31] | 0,97 / 0,71 | 0,57 (n=27) | 0,63 (n=25) | 1,29 (n=21) | sem evidência |
| ab_existe | 84 | 19% vs 26% | 0,74 [0,47 a 1,12] | 0,67 [0,39 a 1,17] | 0,56 / 0,83 | 0,63 (n=37) | 0,98 (n=24) | 0,67 (n=23) | sem evidência |
| ab_superlativo | 202 | 25% vs 26% | 0,98 [0,77 a 1,23] | 0,97 [0,70 a 1,35] | 0,84 / 1,11 | 0,86 (n=81) | 0,93 (n=59) | 1,18 (n=62) | sem evidência |
| ab_uma_das | 82 | 32% vs 26% | 1,23 [0,88 a 1,65] | 1,35 [0,84 a 2,17] | 0,92 / 1,46 | 0,91 (n=34) | 0,94 (n=25) | 2,01 (n=23) | sem evidência |
| ab_o_maior | 104 | 23% vs 26% | 0,90 [0,62 a 1,25] | 0,87 [0,55 a 1,37] | 0,86 / 0,93 | 0,83 (n=42) | 1,12 (n=28) | 0,79 (n=34) | sem evidência |
| ab_em | 69 | 12% vs 26% | 0,45 [0,23 a 0,83] | 0,38 [0,18 a 0,80] | 0,75 / 0,27 | 0,26 (n=30) | 0,59 (n=20) | 0,61 (n=19) | atrapalha (replica) |
| ab_tempo_atras | 96 | 22% vs 26% | 0,85 [0,57 a 1,21] | 0,81 [0,49 a 1,32] | 1,10 / 0,43 | 0,68 (n=40) | 0,34 (n=23) | 1,40 (n=33) | sem evidência |
| ab_imagina | 24 | 21% vs 26% | 0,81 [0,36 a 1,57] | 0,76 [0,28 a 2,04] | 0,97 / 0,49 | 0,28 (n=14) | 1,57 (n=5) | 1,54 (n=5) | amostra pequena |
| ab_parece | 38 | 24% vs 26% | 0,92 [0,51 a 1,52] | 0,90 [0,42 a 1,90] | 2,22 / 0,63 | 1,38 (n=14) | 0,91 (n=13) | 0,35 (n=11) | sem evidência |
| ab_muita_gente | 58 | 10% vs 26% | 0,40 [0,19 a 0,81] | 0,34 [0,14 a 0,79] | 0,24 / 0,60 | 0,70 (n=22) | 0,49 (n=16) | 0,00 (n=20) | atrapalha (replica) |
| ab_pronome | 102 | 25% vs 26% | 0,99 [0,70 a 1,35] | 0,98 [0,62 a 1,54] | 1,01 / 0,97 | 0,84 (n=37) | 1,12 (n=35) | 1,03 (n=30) | sem evidência |
| ab_isso | 88 | 24% vs 26% | 0,93 [0,63 a 1,31] | 0,90 [0,54 a 1,49] | 0,94 / 0,92 | 1,09 (n=32) | 0,92 (n=30) | 0,74 (n=26) | sem evidência |
| ab_nem | 9 | 89% vs 26% | 3,45 [2,20 a 3,81] | 24,69 [3,03 a 201,35] | - / 3,45 | 3,87 (n=3) | 2,62 (n=3) | 3,86 (n=3) | amostra pequena |
| ab_os_as | 160 | 22% vs 26% | 0,85 [0,63 a 1,12] | 0,81 [0,55 a 1,18] | 1,01 / 0,70 | 1,08 (n=61) | 0,59 (n=53) | 0,84 (n=46) | sem evidência |
| ab_tem | 43 | 16% vs 26% | 0,63 [0,32 a 1,16] | 0,56 [0,25 a 1,26] | 0,49 / 0,67 | 0,39 (n=20) | 0,91 (n=13) | 0,77 (n=10) | sem evidência |

## tempo

- `acabou_de`: acabou de / acaba de
- `agora`: agora
- `hoje`: hoje
- `ano_2025_26`: 2025/2026 ou 'esse ano'
- `tempo_recente`: qualquer marca de agora (acabou de, agora, hoje, nesta semana, ontem, 2026, pela 1a vez, oficialmente)
- `gerundio_esta`: está/tá + -ndo (algo em curso)
- `ta_coloquial`: tá / tão / tô / pra (coloquial)
- `futuro_vai`: vai + verbo / prestes a / em breve
- `tempo_passado_ano`: ano antigo (1800 a 2019) ou 'anos 80'

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| acabou_de | 521 | 37% vs 25% | 1,44 [1,28 a 1,60] | 1,87 [1,54 a 2,28] | 1,55 / 1,37 | 1,47 (n=204) | 1,47 (n=160) | 1,36 (n=157) | ajuda (replica) |
| agora | 319 | 28% vs 26% | 1,07 [0,89 a 1,27] | 1,11 [0,86 a 1,43] | 1,14 / 1,03 | 0,93 (n=147) | 1,03 (n=90) | 1,37 (n=82) | sem evidência |
| hoje | 390 | 24% vs 26% | 0,92 [0,76 a 1,09] | 0,87 [0,68 a 1,11] | 0,96 / 0,87 | 0,83 (n=174) | 0,76 (n=112) | 1,23 (n=104) | sem evidência |
| ano_2025_26 | 89 | 15% vs 26% | 0,57 [0,34 a 0,91] | 0,49 [0,27 a 0,89] | 0,78 / 0,13 | 0,43 (n=36) | 0,83 (n=28) | 0,46 (n=25) | atrapalha (replica) |
| tempo_recente | 1299 | 30% vs 25% | 1,15 [1,05 a 1,25] | 1,28 [1,12 a 1,47] | 1,21 / 1,10 | 1,08 (n=549) | 1,14 (n=385) | 1,26 (n=365) | ajuda (replica) |
| gerundio_esta | 677 | 26% vs 26% | 1,01 [0,89 a 1,15] | 1,03 [0,85 a 1,23] | 1,06 / 0,98 | 0,99 (n=283) | 0,95 (n=204) | 1,12 (n=190) | sem evidência |
| ta_coloquial | 668 | 26% vs 26% | 1,03 [0,90 a 1,16] | 1,04 [0,86 a 1,25] | 0,98 / 1,07 | 0,90 (n=297) | 1,01 (n=195) | 1,25 (n=176) | sem evidência |
| futuro_vai | 432 | 25% vs 26% | 0,97 [0,82 a 1,14] | 0,96 [0,76 a 1,20] | 0,99 / 0,95 | 0,87 (n=192) | 1,10 (n=120) | 1,00 (n=120) | sem evidência |
| tempo_passado_ano | 92 | 11% vs 26% | 0,42 [0,23 a 0,73] | 0,35 [0,18 a 0,67] | 0,54 / 0,35 | 0,58 (n=40) | 0,29 (n=27) | 0,31 (n=25) | atrapalha (replica) |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| acabou_de | 521 | 52% vs 38% | 1,34 [1,23 a 1,44] | 1,60 [1,32 a 1,95] | 1,26 / 1,41 | 1,24 (n=204) | 1,43 (n=160) | 1,35 (n=157) | ajuda (replica) |
| agora | 319 | 40% vs 39% | 1,02 [0,89 a 1,16] | 0,97 [0,76 a 1,23] | 1,20 / 0,93 | 1,04 (n=147) | 1,00 (n=90) | 1,01 (n=82) | sem evidência |
| hoje | 390 | 34% vs 39% | 0,87 [0,76 a 1,00] | 0,91 [0,73 a 1,14] | 0,95 / 0,78 | 0,88 (n=174) | 0,78 (n=112) | 0,97 (n=104) | sinal sem replicação |
| ano_2025_26 | 89 | 33% vs 39% | 0,83 [0,61 a 1,10] | 0,73 [0,45 a 1,17] | 0,94 / 0,55 | 0,59 (n=36) | 1,30 (n=28) | 0,62 (n=25) | sem evidência |
| tempo_recente | 1299 | 43% vs 38% | 1,09 [1,02 a 1,16] | 1,17 [1,02 a 1,33] | 1,12 / 1,07 | 1,04 (n=549) | 1,13 (n=385) | 1,11 (n=365) | ajuda (replica) |
| gerundio_esta | 677 | 40% vs 39% | 1,01 [0,92 a 1,11] | 0,95 [0,80 a 1,12] | 1,05 / 0,99 | 1,04 (n=283) | 0,98 (n=204) | 1,01 (n=190) | sem evidência |
| ta_coloquial | 668 | 42% vs 39% | 1,06 [0,97 a 1,16] | 1,12 [0,94 a 1,34] | 1,00 / 1,13 | 0,99 (n=297) | 1,10 (n=195) | 1,16 (n=176) | sem evidência |
| futuro_vai | 432 | 40% vs 39% | 1,03 [0,91 a 1,15] | 0,91 [0,74 a 1,13] | 1,10 / 0,98 | 0,98 (n=192) | 1,03 (n=120) | 1,12 (n=120) | sem evidência |
| tempo_passado_ano | 92 | 22% vs 39% | 0,56 [0,37 a 0,80] | 0,47 [0,28 a 0,79] | 0,61 / 0,53 | 0,53 (n=40) | 0,54 (n=27) | 0,62 (n=25) | atrapalha (replica) |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| acabou_de | 96 | 41% vs 24% | 1,62 [1,25 a 2,02] | 2,33 [1,50 a 3,63] | 1,61 / 1,58 | 1,62 (n=96) | ajuda (replica) |
| agora | 59 | 29% vs 25% | 1,15 [0,75 a 1,65] | 1,22 [0,69 a 2,17] | 0,77 / 1,33 | 1,15 (n=59) | sem evidência |
| hoje | 83 | 20% vs 25% | 0,82 [0,53 a 1,21] | 0,74 [0,42 a 1,29] | 1,02 / 0,54 | 0,82 (n=83) | sem evidência |
| ano_2025_26 | 25 | 28% vs 25% | 1,12 [0,57 a 1,90] | 1,18 [0,49 a 2,87] | 1,20 / 0,98 | 1,12 (n=25) | sem evidência |
| tempo_recente | 250 | 30% vs 24% | 1,20 [0,98 a 1,43] | 1,37 [1,01 a 1,87] | 1,26 / 1,08 | 1,20 (n=250) | sem evidência |
| gerundio_esta | 137 | 23% vs 25% | 0,93 [0,68 a 1,24] | 0,89 [0,58 a 1,37] | 0,91 / 0,92 | 0,93 (n=137) | sem evidência |
| ta_coloquial | 135 | 31% vs 24% | 1,24 [0,95 a 1,57] | 1,41 [0,95 a 2,09] | 0,89 / 1,66 | 1,24 (n=135) | sem evidência |
| futuro_vai | 80 | 23% vs 25% | 0,90 [0,59 a 1,31] | 0,88 [0,51 a 1,51] | 1,02 / 0,71 | 0,90 (n=80) | sem evidência |
| tempo_passado_ano | 22 | 27% vs 25% | 1,09 [0,52 a 1,92] | 1,05 [0,41 a 2,74] | 1,30 / 0,86 | 1,09 (n=22) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| acabou_de | 96 | 35% vs 25% | 1,39 [1,04 a 1,78] | 1,72 [1,10 a 2,71] | 1,26 / 1,54 | 1,39 (n=96) | ajuda (replica) |
| agora | 59 | 25% vs 25% | 1,00 [0,63 a 1,48] | 1,00 [0,55 a 1,82] | 0,89 / 1,03 | 1,00 (n=59) | sem evidência |
| hoje | 82 | 24% vs 26% | 0,96 [0,64 a 1,36] | 0,94 [0,55 a 1,59] | 1,24 / 0,56 | 0,96 (n=82) | sem evidência |
| ano_2025_26 | 25 | 44% vs 25% | 1,73 [1,05 a 2,47] | 2,39 [1,07 a 5,36] | 1,84 / 1,52 | 1,73 (n=25) | ajuda (replica) |
| tempo_recente | 249 | 31% vs 24% | 1,21 [1,00 a 1,45] | 1,41 [1,04 a 1,92] | 1,27 / 1,11 | 1,21 (n=249) | ajuda (replica) |
| gerundio_esta | 137 | 23% vs 26% | 0,89 [0,64 a 1,19] | 0,84 [0,54 a 1,29] | 0,97 / 0,76 | 0,89 (n=137) | sem evidência |
| ta_coloquial | 135 | 30% vs 25% | 1,16 [0,89 a 1,48] | 1,27 [0,85 a 1,88] | 1,24 / 1,03 | 1,16 (n=135) | sem evidência |
| futuro_vai | 80 | 24% vs 26% | 0,93 [0,62 a 1,34] | 0,91 [0,53 a 1,54] | 1,05 / 0,74 | 0,93 (n=80) | sem evidência |
| tempo_passado_ano | 22 | 23% vs 26% | 0,89 [0,40 a 1,70] | 0,84 [0,31 a 2,31] | 0,83 / 0,89 | 0,89 (n=22) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| acabou_de | 506 | 37% vs 25% | 1,44 [1,28 a 1,61] | 1,90 [1,56 a 2,32] | 1,60 / 1,35 | 1,50 (n=194) | 1,46 (n=159) | 1,36 (n=153) | ajuda (replica) |
| agora | 362 | 27% vs 26% | 1,06 [0,89 a 1,25] | 1,10 [0,87 a 1,41] | 1,12 / 1,03 | 0,93 (n=159) | 1,04 (n=106) | 1,31 (n=97) | sem evidência |
| hoje | 436 | 25% vs 26% | 0,96 [0,81 a 1,13] | 0,93 [0,74 a 1,17] | 1,04 / 0,88 | 0,81 (n=191) | 0,89 (n=128) | 1,29 (n=117) | sem evidência |
| ano_2025_26 | 121 | 15% vs 26% | 0,58 [0,37 a 0,87] | 0,50 [0,30 a 0,83] | 0,82 / 0,36 | 0,45 (n=52) | 0,81 (n=34) | 0,55 (n=35) | atrapalha (replica) |
| tempo_recente | 1372 | 29% vs 25% | 1,13 [1,04 a 1,23] | 1,26 [1,10 a 1,45] | 1,20 / 1,09 | 1,06 (n=570) | 1,11 (n=415) | 1,27 (n=387) | ajuda (replica) |
| gerundio_esta | 740 | 25% vs 26% | 0,98 [0,87 a 1,11] | 0,98 [0,82 a 1,17] | 1,01 / 0,96 | 0,94 (n=296) | 0,94 (n=230) | 1,08 (n=214) | sem evidência |
| ta_coloquial | 820 | 26% vs 26% | 1,00 [0,88 a 1,12] | 1,00 [0,84 a 1,19] | 0,94 / 1,05 | 0,89 (n=286) | 0,96 (n=328) | 1,20 (n=206) | sem evidência |
| futuro_vai | 513 | 26% vs 26% | 1,01 [0,87 a 1,16] | 1,01 [0,82 a 1,25] | 1,10 / 0,94 | 0,93 (n=221) | 1,14 (n=152) | 0,99 (n=140) | sem evidência |
| tempo_passado_ano | 103 | 15% vs 26% | 0,57 [0,35 a 0,88] | 0,49 [0,28 a 0,84] | 0,71 / 0,53 | 0,50 (n=46) | 0,81 (n=29) | 0,41 (n=28) | atrapalha (replica) |

## verbo

- `verbo_passado`: verbo de ação no passado (criou, destruiu, venceu...)
- `v_criou`: criou/inventou/descobriu/desenvolveu/construiu/lançou
- `v_queda`: destruiu/faliu/quebrou/perdeu/fechou
- `v_venceu`: venceu/derrotou/superou/ultrapassou/humilhou/dominou
- `v_proibiu`: proibiu/baniu/bloqueou/multou/processou/prendeu/cancelou
- `v_dinheiro`: comprou/vendeu/gastou/pagou/investiu/faturou/lucrou
- `v_recusou`: ignorou/recusou/rejeitou/abandonou/desistiu/largou
- `v_copiou`: copiou/roubou/enganou/traiu
- `v_transformou`: transformou/mudou/virou/tornou
- `v_fez`: fez/deu/colocou/deixou/levou (verbo genérico)
- `v_ser_capaz`: é capaz de / consegue / pode (capacidade)

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| verbo_passado | 2728 | 26% vs 26% | 1,00 [0,93 a 1,06] | 0,99 [0,88 a 1,11] | 0,97 / 1,02 | 1,00 (n=1168) | 0,98 (n=782) | 1,00 (n=778) | sem evidência |
| v_criou | 656 | 26% vs 26% | 1,02 [0,90 a 1,16] | 1,03 [0,86 a 1,25] | 0,93 / 1,12 | 1,04 (n=272) | 0,95 (n=195) | 1,07 (n=189) | sem evidência |
| v_queda | 225 | 21% vs 26% | 0,83 [0,64 a 1,05] | 0,77 [0,56 a 1,07] | 0,77 / 0,88 | 0,75 (n=99) | 0,75 (n=62) | 1,03 (n=64) | sem evidência |
| v_venceu | 85 | 32% vs 26% | 1,23 [0,89 a 1,64] | 1,34 [0,85 a 2,13] | 1,25 / 1,22 | 1,30 (n=36) | 1,04 (n=26) | 1,35 (n=23) | sem evidência |
| v_proibiu | 50 | 48% vs 26% | 1,86 [1,35 a 2,39] | 2,69 [1,54 a 4,71] | 1,80 / 2,16 | 1,86 (n=23) | 1,93 (n=12) | 1,81 (n=15) | ajuda (replica) |
| v_dinheiro | 285 | 19% vs 26% | 0,74 [0,58 a 0,93] | 0,66 [0,48 a 0,89] | 0,42 / 1,03 | 0,60 (n=124) | 0,80 (n=77) | 0,88 (n=84) | sinal sem replicação |
| v_recusou | 90 | 31% vs 26% | 1,21 [0,87 a 1,60] | 1,30 [0,83 a 2,05] | 1,39 / 0,94 | 0,80 (n=39) | 1,66 (n=28) | 1,35 (n=23) | sem evidência |
| v_copiou | 61 | 31% vs 26% | 1,21 [0,81 a 1,69] | 1,31 [0,76 a 2,27] | 1,09 / 1,41 | 1,65 (n=26) | 0,91 (n=17) | 0,86 (n=18) | sem evidência |
| v_transformou | 451 | 23% vs 26% | 0,89 [0,75 a 1,05] | 0,85 [0,68 a 1,07] | 1,05 / 0,73 | 0,84 (n=186) | 1,05 (n=129) | 0,83 (n=136) | sem evidência |
| v_fez | 432 | 27% vs 26% | 1,04 [0,89 a 1,21] | 1,06 [0,85 a 1,33] | 0,94 / 1,13 | 0,88 (n=198) | 1,25 (n=121) | 1,10 (n=113) | sem evidência |
| v_ser_capaz | 477 | 21% vs 26% | 0,81 [0,68 a 0,96] | 0,75 [0,59 a 0,94] | 0,77 / 0,84 | 0,78 (n=214) | 0,92 (n=139) | 0,75 (n=124) | atrapalha (replica) |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| verbo_passado | 2728 | 39% vs 39% | 0,99 [0,94 a 1,03] | 1,05 [0,94 a 1,16] | 0,97 / 1,01 | 0,98 (n=1168) | 1,02 (n=782) | 0,97 (n=778) | sem evidência |
| v_criou | 656 | 40% vs 39% | 1,03 [0,94 a 1,13] | 1,04 [0,87 a 1,23] | 0,98 / 1,08 | 1,08 (n=272) | 1,01 (n=195) | 0,98 (n=189) | sem evidência |
| v_queda | 225 | 32% vs 39% | 0,83 [0,68 a 0,99] | 0,85 [0,63 a 1,14] | 0,87 / 0,80 | 0,75 (n=99) | 0,79 (n=62) | 1,01 (n=64) | sinal sem replicação |
| v_venceu | 85 | 42% vs 39% | 1,08 [0,83 a 1,36] | 1,27 [0,81 a 2,00] | 0,94 / 1,21 | 1,10 (n=36) | 1,03 (n=26) | 1,12 (n=23) | sem evidência |
| v_proibiu | 50 | 66% vs 39% | 1,69 [1,33 a 1,98] | 3,38 [1,83 a 6,23] | 1,61 / 1,78 | 1,49 (n=23) | 2,03 (n=12) | 1,72 (n=15) | ajuda (replica) |
| v_dinheiro | 285 | 30% vs 40% | 0,77 [0,64 a 0,91] | 0,76 [0,58 a 0,99] | 0,52 / 1,04 | 0,66 (n=124) | 0,82 (n=77) | 0,89 (n=84) | sinal sem replicação |
| v_recusou | 90 | 43% vs 39% | 1,11 [0,86 a 1,37] | 1,49 [0,96 a 2,30] | 1,20 / 0,94 | 0,81 (n=39) | 1,39 (n=28) | 1,24 (n=23) | sem evidência |
| v_copiou | 61 | 43% vs 39% | 1,09 [0,79 a 1,41] | 1,16 [0,68 a 1,96] | 1,07 / 1,09 | 1,42 (n=26) | 1,15 (n=17) | 0,57 (n=18) | sem evidência |
| v_transformou | 451 | 35% vs 39% | 0,90 [0,79 a 1,02] | 0,87 [0,71 a 1,07] | 1,01 / 0,77 | 0,82 (n=186) | 1,00 (n=129) | 0,91 (n=136) | sem evidência |
| v_fez | 432 | 41% vs 39% | 1,04 [0,92 a 1,16] | 1,10 [0,90 a 1,36] | 0,97 / 1,11 | 0,96 (n=198) | 1,19 (n=121) | 1,01 (n=113) | sem evidência |
| v_ser_capaz | 477 | 37% vs 39% | 0,95 [0,85 a 1,07] | 0,80 [0,66 a 0,99] | 1,01 / 0,92 | 0,89 (n=214) | 1,05 (n=139) | 0,96 (n=124) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| verbo_passado | 585 | 25% vs 25% | 1,02 [0,88 a 1,16] | 1,04 [0,80 a 1,34] | 0,94 / 1,14 | 1,02 (n=585) | sem evidência |
| v_criou | 126 | 19% vs 26% | 0,76 [0,52 a 1,07] | 0,70 [0,43 a 1,12] | 0,61 / 1,01 | 0,76 (n=126) | sem evidência |
| v_queda | 60 | 25% vs 25% | 1,00 [0,63 a 1,48] | 0,94 [0,51 a 1,72] | 0,84 / 1,15 | 1,00 (n=60) | sem evidência |
| v_venceu | 17 | 29% vs 25% | 1,17 [0,53 a 2,12] | 1,26 [0,44 a 3,56] | 1,18 / 1,15 | 1,17 (n=17) | amostra pequena |
| v_proibiu | 15 | 53% vs 25% | 2,13 [1,20 a 3,00] | 3,19 [1,17 a 8,66] | 1,96 / 2,58 | 2,13 (n=15) | amostra pequena |
| v_dinheiro | 69 | 19% vs 25% | 0,75 [0,45 a 1,18] | 0,64 [0,34 a 1,20] | 0,58 / 1,00 | 0,75 (n=69) | sem evidência |
| v_recusou | 20 | 20% vs 25% | 0,80 [0,32 a 1,66] | 0,72 [0,24 a 2,16] | 1,08 / 0,00 | 0,80 (n=20) | sem evidência |
| v_copiou | 13 | 38% vs 25% | 1,53 [0,71 a 2,57] | 1,95 [0,63 a 6,02] | 1,96 / 0,00 | 1,53 (n=13) | amostra pequena |
| v_transformou | 91 | 21% vs 25% | 0,83 [0,55 a 1,21] | 0,78 [0,46 a 1,31] | 0,92 / 0,69 | 0,83 (n=91) | sem evidência |
| v_fez | 92 | 35% vs 24% | 1,39 [1,03 a 1,79] | 1,71 [1,09 a 2,68] | 1,19 / 1,62 | 1,39 (n=92) | ajuda (replica) |
| v_ser_capaz | 90 | 28% vs 25% | 1,11 [0,78 a 1,51] | 1,20 [0,73 a 1,95] | 1,08 / 1,09 | 1,11 (n=90) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| verbo_passado | 584 | 25% vs 26% | 0,99 [0,86 a 1,14] | 0,99 [0,76 a 1,27] | 0,96 / 1,05 | 0,99 (n=584) | sem evidência |
| v_criou | 126 | 19% vs 26% | 0,75 [0,52 a 1,05] | 0,65 [0,41 a 1,04] | 0,63 / 0,95 | 0,75 (n=126) | sem evidência |
| v_queda | 60 | 12% vs 26% | 0,46 [0,23 a 0,87] | 0,37 [0,17 a 0,83] | 0,34 / 0,59 | 0,46 (n=60) | atrapalha (replica) |
| v_venceu | 17 | 41% vs 25% | 1,62 [0,85 a 2,51] | 2,09 [0,79 a 5,54] | 1,50 / 1,78 | 1,62 (n=17) | amostra pequena |
| v_proibiu | 15 | 33% vs 25% | 1,31 [0,60 a 2,29] | 1,46 [0,49 a 4,32] | 1,50 / 0,89 | 1,31 (n=15) | amostra pequena |
| v_dinheiro | 69 | 26% vs 25% | 1,02 [0,67 a 1,47] | 1,04 [0,59 a 1,83] | 0,92 / 1,19 | 1,02 (n=69) | sem evidência |
| v_recusou | 20 | 35% vs 25% | 1,37 [0,71 a 2,22] | 1,59 [0,63 a 4,03] | 1,29 / 1,78 | 1,37 (n=20) | sem evidência |
| v_copiou | 13 | 31% vs 25% | 1,21 [0,50 a 2,26] | 1,30 [0,39 a 4,30] | 1,13 / 1,78 | 1,21 (n=13) | amostra pequena |
| v_transformou | 91 | 24% vs 26% | 0,95 [0,65 a 1,33] | 0,92 [0,56 a 1,52] | 0,94 / 1,00 | 0,95 (n=91) | sem evidência |
| v_fez | 91 | 31% vs 25% | 1,21 [0,87 a 1,60] | 1,33 [0,83 a 2,11] | 1,38 / 0,94 | 1,21 (n=91) | sem evidência |
| v_ser_capaz | 90 | 21% vs 26% | 0,83 [0,55 a 1,20] | 0,77 [0,45 a 1,30] | 0,87 / 0,75 | 0,83 (n=90) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| verbo_passado | 2846 | 26% vs 25% | 1,02 [0,96 a 1,08] | 1,05 [0,93 a 1,18] | 0,99 / 1,04 | 1,00 (n=1192) | 1,01 (n=830) | 1,05 (n=824) | sem evidência |
| v_criou | 680 | 28% vs 25% | 1,08 [0,95 a 1,22] | 1,12 [0,94 a 1,35] | 1,05 / 1,11 | 1,12 (n=272) | 1,01 (n=211) | 1,10 (n=197) | sem evidência |
| v_queda | 246 | 24% vs 26% | 0,92 [0,73 a 1,14] | 0,89 [0,65 a 1,20] | 0,96 / 0,88 | 0,76 (n=102) | 0,93 (n=68) | 1,12 (n=76) | sem evidência |
| v_venceu | 94 | 30% vs 26% | 1,16 [0,83 a 1,54] | 1,23 [0,79 a 1,92] | 1,13 / 1,18 | 1,20 (n=42) | 0,95 (n=29) | 1,34 (n=23) | sem evidência |
| v_proibiu | 62 | 39% vs 26% | 1,50 [1,07 a 1,99] | 1,83 [1,09 a 3,06] | 1,49 / 1,55 | 1,72 (n=27) | 1,23 (n=16) | 1,42 (n=19) | ajuda (replica) |
| v_dinheiro | 282 | 17% vs 26% | 0,68 [0,52 a 0,86] | 0,59 [0,43 a 0,80] | 0,42 / 0,92 | 0,60 (n=123) | 0,67 (n=76) | 0,79 (n=83) | atrapalha (replica) |
| v_recusou | 93 | 30% vs 26% | 1,17 [0,84 a 1,56] | 1,23 [0,78 a 1,92] | 1,40 / 0,90 | 0,89 (n=39) | 1,63 (n=29) | 1,08 (n=25) | sem evidência |
| v_copiou | 54 | 30% vs 26% | 1,15 [0,74 a 1,66] | 1,22 [0,68 a 2,21] | 1,09 / 1,24 | 1,51 (n=23) | 0,98 (n=16) | 0,77 (n=15) | sem evidência |
| v_transformou | 456 | 24% vs 26% | 0,95 [0,80 a 1,11] | 0,92 [0,74 a 1,15] | 1,14 / 0,76 | 0,86 (n=185) | 1,01 (n=132) | 1,00 (n=139) | sem evidência |
| v_fez | 478 | 27% vs 26% | 1,06 [0,91 a 1,22] | 1,09 [0,88 a 1,34] | 0,91 / 1,18 | 0,88 (n=206) | 1,14 (n=141) | 1,24 (n=131) | sem evidência |
| v_ser_capaz | 571 | 20% vs 26% | 0,78 [0,66 a 0,91] | 0,70 [0,56 a 0,86] | 0,83 / 0,74 | 0,79 (n=245) | 0,86 (n=178) | 0,65 (n=148) | atrapalha (replica) |

## numero

- `dinheiro`: qualquer dinheiro (R$, reais, dólares, milhões, bilhões, %)
- `moeda`: R$ / reais / dólares
- `escala`: milhões / bilhões / trilhões
- `bilhao`: bilhão / bilhões / trilhão
- `percentual`: % / por cento
- `num_digito`: algum número em algarismo
- `num_redondo`: número redondo (10, 100, 1 milhão)
- `num_quebrado`: número quebrado (47, 58, 3,7)
- `num_ano`: ano em algarismo (1990, 2026)
- `num_por_extenso`: número por extenso (dois, cinco, dez, cem, mil)

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| dinheiro | 1473 | 26% vs 26% | 0,99 [0,91 a 1,08] | 0,99 [0,86 a 1,13] | 0,95 / 1,04 | 0,95 (n=628) | 0,88 (n=433) | 1,17 (n=412) | sem evidência |
| moeda | 933 | 24% vs 26% | 0,94 [0,84 a 1,05] | 0,91 [0,77 a 1,07] | 0,92 / 0,97 | 0,84 (n=405) | 0,81 (n=264) | 1,25 (n=264) | sem evidência |
| escala | 1222 | 26% vs 26% | 1,00 [0,91 a 1,10] | 1,00 [0,86 a 1,17] | 0,96 / 1,04 | 0,92 (n=523) | 0,94 (n=355) | 1,21 (n=344) | sem evidência |
| bilhao | 610 | 24% vs 26% | 0,93 [0,80 a 1,07] | 0,89 [0,73 a 1,09] | 0,97 / 0,88 | 0,80 (n=267) | 0,88 (n=172) | 1,18 (n=171) | sem evidência |
| percentual | 99 | 21% vs 26% | 0,82 [0,56 a 1,17] | 0,77 [0,48 a 1,26] | 0,48 / 1,26 | 1,00 (n=43) | 0,53 (n=29) | 0,86 (n=27) | sem evidência |
| num_digito | 1918 | 25% vs 26% | 0,98 [0,90 a 1,05] | 0,95 [0,84 a 1,08] | 0,93 / 1,02 | 0,97 (n=802) | 0,97 (n=565) | 1,01 (n=551) | sem evidência |
| num_redondo | 1083 | 26% vs 26% | 1,00 [0,91 a 1,11] | 1,00 [0,86 a 1,17] | 0,92 / 1,11 | 0,96 (n=447) | 0,96 (n=322) | 1,11 (n=314) | sem evidência |
| num_quebrado | 712 | 26% vs 26% | 1,00 [0,88 a 1,13] | 1,00 [0,84 a 1,20] | 1,00 / 1,01 | 1,02 (n=302) | 1,03 (n=206) | 0,95 (n=204) | sem evidência |
| num_ano | 196 | 15% vs 26% | 0,59 [0,42 a 0,82] | 0,51 [0,35 a 0,76] | 0,70 / 0,45 | 0,62 (n=81) | 0,82 (n=61) | 0,29 (n=54) | atrapalha (replica) |
| num_por_extenso | 577 | 27% vs 26% | 1,06 [0,92 a 1,20] | 1,09 [0,90 a 1,32] | 1,06 / 1,05 | 1,11 (n=238) | 1,11 (n=174) | 0,92 (n=165) | sem evidência |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| dinheiro | 1473 | 37% vs 40% | 0,94 [0,88 a 1,00] | 1,00 [0,88 a 1,14] | 0,90 / 0,98 | 0,89 (n=628) | 0,89 (n=433) | 1,07 (n=412) | sem evidência |
| moeda | 933 | 36% vs 40% | 0,91 [0,83 a 0,99] | 0,94 [0,81 a 1,10] | 0,89 / 0,93 | 0,83 (n=405) | 0,81 (n=264) | 1,13 (n=264) | sinal sem replicação |
| escala | 1222 | 37% vs 40% | 0,94 [0,88 a 1,01] | 1,04 [0,90 a 1,19] | 0,92 / 0,97 | 0,87 (n=523) | 0,91 (n=355) | 1,09 (n=344) | sem evidência |
| bilhao | 610 | 35% vs 39% | 0,90 [0,81 a 1,00] | 0,93 [0,77 a 1,12] | 0,93 / 0,85 | 0,81 (n=267) | 0,92 (n=172) | 1,03 (n=171) | sem evidência |
| percentual | 99 | 30% vs 39% | 0,78 [0,57 a 1,02] | 0,66 [0,42 a 1,02] | 0,48 / 1,18 | 0,74 (n=43) | 0,84 (n=29) | 0,77 (n=27) | sem evidência |
| num_digito | 1918 | 39% vs 39% | 1,00 [0,95 a 1,06] | 1,04 [0,93 a 1,17] | 0,97 / 1,04 | 0,99 (n=802) | 0,98 (n=565) | 1,06 (n=551) | sem evidência |
| num_redondo | 1083 | 39% vs 39% | 0,99 [0,91 a 1,06] | 0,99 [0,86 a 1,14] | 0,92 / 1,06 | 1,01 (n=447) | 0,90 (n=322) | 1,04 (n=314) | sem evidência |
| num_quebrado | 712 | 42% vs 39% | 1,07 [0,98 a 1,16] | 1,15 [0,98 a 1,36] | 1,06 / 1,08 | 1,00 (n=302) | 1,11 (n=206) | 1,11 (n=204) | sem evidência |
| num_ano | 196 | 31% vs 39% | 0,78 [0,63 a 0,96] | 0,70 [0,50 a 0,96] | 0,89 / 0,62 | 0,62 (n=81) | 1,04 (n=61) | 0,72 (n=54) | atrapalha (replica) |
| num_por_extenso | 577 | 40% vs 39% | 1,03 [0,93 a 1,13] | 1,11 [0,92 a 1,33] | 0,98 / 1,08 | 1,04 (n=238) | 1,09 (n=174) | 0,94 (n=165) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| dinheiro | 326 | 23% vs 26% | 0,93 [0,76 a 1,12] | 0,85 [0,63 a 1,16] | 0,94 / 0,91 | 0,93 (n=326) | sem evidência |
| moeda | 214 | 26% vs 25% | 1,02 [0,81 a 1,27] | 1,01 [0,71 a 1,44] | 0,99 / 1,07 | 1,02 (n=214) | sem evidência |
| escala | 266 | 24% vs 25% | 0,96 [0,77 a 1,18] | 0,91 [0,65 a 1,26] | 0,92 / 1,03 | 0,96 (n=266) | sem evidência |
| bilhao | 137 | 20% vs 26% | 0,79 [0,55 a 1,08] | 0,68 [0,43 a 1,06] | 0,74 / 0,86 | 0,79 (n=137) | sem evidência |
| percentual | 25 | 8% vs 25% | 0,32 [0,09 a 1,00] | 0,25 [0,06 a 1,08] | 0,00 / 0,86 | 0,32 (n=25) | sinal sem replicação |
| num_digito | 424 | 23% vs 26% | 0,92 [0,77 a 1,09] | 0,84 [0,64 a 1,11] | 0,84 / 1,05 | 0,92 (n=424) | sem evidência |
| num_redondo | 242 | 20% vs 26% | 0,81 [0,62 a 1,03] | 0,71 [0,50 a 1,00] | 0,65 / 1,10 | 0,81 (n=242) | sem evidência |
| num_quebrado | 149 | 26% vs 25% | 1,02 [0,76 a 1,32] | 1,02 [0,69 a 1,53] | 1,07 / 0,92 | 1,02 (n=149) | sem evidência |
| num_ano | 46 | 24% vs 25% | 0,95 [0,55 a 1,51] | 0,93 [0,46 a 1,85] | 0,93 / 0,96 | 0,95 (n=46) | sem evidência |
| num_por_extenso | 107 | 30% vs 25% | 1,19 [0,88 a 1,56] | 1,26 [0,82 a 1,95] | 0,88 / 1,36 | 1,19 (n=107) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| dinheiro | 325 | 22% vs 26% | 0,88 [0,72 a 1,07] | 0,79 [0,58 a 1,07] | 0,91 / 0,84 | 0,88 (n=325) | sem evidência |
| moeda | 213 | 25% vs 26% | 0,98 [0,77 a 1,22] | 0,95 [0,67 a 1,35] | 0,98 / 0,96 | 0,98 (n=213) | sem evidência |
| escala | 265 | 24% vs 26% | 0,95 [0,76 a 1,16] | 0,90 [0,65 a 1,25] | 0,93 / 0,98 | 0,95 (n=265) | sem evidência |
| bilhao | 137 | 20% vs 26% | 0,80 [0,57 a 1,10] | 0,71 [0,46 a 1,11] | 0,80 / 0,81 | 0,80 (n=137) | sem evidência |
| percentual | 25 | 8% vs 26% | 0,31 [0,09 a 0,98] | 0,25 [0,06 a 1,08] | 0,24 / 0,44 | 0,31 (n=25) | sinal sem replicação |
| num_digito | 423 | 24% vs 26% | 0,95 [0,80 a 1,11] | 0,89 [0,68 a 1,17] | 0,95 / 0,93 | 0,95 (n=423) | sem evidência |
| num_redondo | 241 | 22% vs 26% | 0,85 [0,66 a 1,07] | 0,76 [0,54 a 1,07] | 0,85 / 0,85 | 0,85 (n=241) | sem evidência |
| num_quebrado | 149 | 24% vs 26% | 0,95 [0,71 a 1,24] | 0,92 [0,61 a 1,38] | 0,98 / 0,89 | 0,95 (n=149) | sem evidência |
| num_ano | 46 | 37% vs 25% | 1,45 [0,96 a 2,02] | 1,76 [0,95 a 3,25] | 1,48 / 1,38 | 1,45 (n=46) | sem evidência |
| num_por_extenso | 107 | 27% vs 25% | 1,06 [0,77 a 1,42] | 1,09 [0,70 a 1,70] | 1,07 / 1,01 | 1,06 (n=107) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| dinheiro | 1552 | 26% vs 26% | 1,01 [0,93 a 1,10] | 1,02 [0,89 a 1,17] | 1,01 / 1,01 | 0,95 (n=650) | 0,94 (n=467) | 1,16 (n=435) | sem evidência |
| moeda | 909 | 24% vs 26% | 0,92 [0,82 a 1,04] | 0,88 [0,74 a 1,04] | 0,93 / 0,92 | 0,84 (n=390) | 0,81 (n=277) | 1,18 (n=242) | sem evidência |
| escala | 1280 | 26% vs 26% | 1,00 [0,91 a 1,10] | 1,00 [0,87 a 1,16] | 1,00 / 1,00 | 0,90 (n=536) | 0,99 (n=390) | 1,17 (n=354) | sem evidência |
| bilhao | 619 | 22% vs 26% | 0,87 [0,75 a 1,01] | 0,82 [0,67 a 1,00] | 0,94 / 0,79 | 0,76 (n=261) | 0,87 (n=180) | 1,04 (n=178) | sem evidência |
| percentual | 113 | 22% vs 26% | 0,86 [0,60 a 1,19] | 0,82 [0,52 a 1,28] | 0,64 / 1,12 | 1,06 (n=44) | 0,52 (n=38) | 1,00 (n=31) | sem evidência |
| num_digito | 1879 | 25% vs 26% | 0,99 [0,91 a 1,07] | 0,97 [0,86 a 1,11] | 0,97 / 1,00 | 0,95 (n=811) | 0,95 (n=454) | 1,06 (n=614) | sem evidência |
| num_redondo | 1066 | 25% vs 26% | 0,97 [0,87 a 1,07] | 0,94 [0,81 a 1,10] | 0,89 / 1,03 | 0,92 (n=445) | 0,86 (n=251) | 1,08 (n=370) | sem evidência |
| num_quebrado | 678 | 29% vs 25% | 1,12 [0,99 a 1,25] | 1,19 [0,99 a 1,43] | 1,17 / 1,08 | 1,11 (n=308) | 1,13 (n=164) | 1,12 (n=206) | sem evidência |
| num_ano | 224 | 16% vs 26% | 0,62 [0,46 a 0,83] | 0,54 [0,38 a 0,78] | 0,74 / 0,55 | 0,51 (n=99) | 0,97 (n=61) | 0,48 (n=64) | atrapalha (replica) |
| num_por_extenso | 760 | 27% vs 26% | 1,03 [0,92 a 1,16] | 1,06 [0,89 a 1,26] | 1,02 / 1,05 | 1,00 (n=280) | 1,10 (n=330) | 0,98 (n=150) | sem evidência |

## superlativo

- `superlativo`: maior/menor/melhor/pior/primeiro/único/recorde/do mundo
- `s_maior`: maior/maiores
- `s_primeiro`: primeiro/primeira
- `s_unico`: único/única/só um
- `s_do_mundo`: do mundo / do planeta
- `s_da_historia`: da história
- `s_mais_adj`: o/a mais + adjetivo (mais rico, mais odiado)

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| superlativo | 1497 | 26% vs 26% | 0,99 [0,91 a 1,08] | 0,98 [0,86 a 1,12] | 1,00 / 0,98 | 1,05 (n=620) | 0,98 (n=435) | 0,92 (n=442) | sem evidência |
| s_maior | 732 | 26% vs 26% | 1,00 [0,88 a 1,13] | 1,00 [0,84 a 1,20] | 1,04 / 0,97 | 1,06 (n=309) | 1,06 (n=204) | 0,87 (n=219) | sem evidência |
| s_primeiro | 116 | 27% vs 26% | 1,04 [0,76 a 1,37] | 1,05 [0,69 a 1,59] | 0,78 / 1,20 | 1,33 (n=44) | 0,75 (n=36) | 0,97 (n=36) | sem evidência |
| s_unico | 130 | 26% vs 26% | 1,01 [0,75 a 1,33] | 1,02 [0,69 a 1,52] | 1,22 / 0,89 | 0,99 (n=51) | 0,99 (n=39) | 1,07 (n=40) | sem evidência |
| s_do_mundo | 631 | 27% vs 26% | 1,05 [0,92 a 1,19] | 1,08 [0,90 a 1,30] | 1,12 / 1,00 | 1,14 (n=255) | 0,99 (n=187) | 0,98 (n=189) | sem evidência |
| s_da_historia | 166 | 26% vs 26% | 1,01 [0,77 a 1,28] | 1,01 [0,71 a 1,44] | 1,10 / 0,88 | 0,89 (n=70) | 0,99 (n=47) | 1,19 (n=49) | sem evidência |
| s_mais_adj | 69 | 28% vs 26% | 1,07 [0,71 a 1,52] | 1,10 [0,65 a 1,87] | 1,29 / 0,97 | 0,69 (n=34) | 1,07 (n=18) | 1,82 (n=17) | sem evidência |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| superlativo | 1497 | 38% vs 40% | 0,96 [0,90 a 1,02] | 1,00 [0,88 a 1,13] | 1,00 / 0,93 | 1,00 (n=620) | 0,99 (n=435) | 0,88 (n=442) | sem evidência |
| s_maior | 732 | 36% vs 40% | 0,91 [0,83 a 1,00] | 0,97 [0,82 a 1,15] | 1,00 / 0,82 | 0,96 (n=309) | 0,98 (n=204) | 0,79 (n=219) | sem evidência |
| s_primeiro | 116 | 45% vs 39% | 1,15 [0,92 a 1,38] | 1,23 [0,84 a 1,81] | 1,09 / 1,21 | 1,26 (n=44) | 1,01 (n=36) | 1,15 (n=36) | sem evidência |
| s_unico | 130 | 35% vs 39% | 0,91 [0,71 a 1,12] | 0,95 [0,65 a 1,38] | 1,06 / 0,81 | 0,93 (n=51) | 0,69 (n=39) | 1,10 (n=40) | sem evidência |
| s_do_mundo | 631 | 39% vs 39% | 1,00 [0,90 a 1,10] | 1,03 [0,87 a 1,24] | 1,04 / 0,97 | 1,05 (n=255) | 1,00 (n=187) | 0,92 (n=189) | sem evidência |
| s_da_historia | 166 | 36% vs 39% | 0,92 [0,75 a 1,12] | 1,12 [0,79 a 1,57] | 1,01 / 0,79 | 0,83 (n=70) | 1,19 (n=47) | 0,79 (n=49) | sem evidência |
| s_mais_adj | 69 | 35% vs 39% | 0,89 [0,63 a 1,19] | 0,91 [0,54 a 1,52] | 1,05 / 0,84 | 0,62 (n=34) | 1,08 (n=18) | 1,22 (n=17) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| superlativo | 304 | 23% vs 26% | 0,91 [0,73 a 1,11] | 0,82 [0,60 a 1,12] | 0,87 / 0,95 | 0,91 (n=304) | sem evidência |
| s_maior | 156 | 22% vs 25% | 0,89 [0,66 a 1,18] | 0,81 [0,54 a 1,22] | 0,81 / 1,05 | 0,89 (n=156) | sem evidência |
| s_primeiro | 15 | 33% vs 25% | 1,33 [0,61 a 2,32] | 1,44 [0,49 a 4,21] | 1,44 / 1,15 | 1,33 (n=15) | amostra pequena |
| s_unico | 31 | 26% vs 25% | 1,03 [0,55 a 1,72] | 1,00 [0,44 a 2,27] | 0,54 / 1,38 | 1,03 (n=31) | sem evidência |
| s_do_mundo | 127 | 21% vs 25% | 0,85 [0,60 a 1,16] | 0,78 [0,50 a 1,22] | 0,98 / 0,64 | 0,85 (n=127) | sem evidência |
| s_da_historia | 40 | 28% vs 25% | 1,10 [0,64 a 1,71] | 1,08 [0,53 a 2,20] | 0,98 / 1,53 | 1,10 (n=40) | sem evidência |
| s_mais_adj | 14 | 57% vs 25% | 2,28 [1,30 a 3,14] | 3,76 [1,31 a 10,79] | 1,73 / 2,30 | 2,28 (n=14) | amostra pequena |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| superlativo | 304 | 25% vs 26% | 0,98 [0,80 a 1,18] | 0,96 [0,72 a 1,30] | 0,93 / 1,05 | 0,98 (n=304) | sem evidência |
| s_maior | 156 | 22% vs 26% | 0,85 [0,63 a 1,13] | 0,79 [0,52 a 1,18] | 0,81 / 0,94 | 0,85 (n=156) | sem evidência |
| s_primeiro | 15 | 47% vs 25% | 1,83 [0,97 a 2,74] | 2,60 [0,93 a 7,23] | 1,84 / 1,78 | 1,83 (n=15) | amostra pequena |
| s_unico | 31 | 29% vs 25% | 1,14 [0,63 a 1,83] | 1,20 [0,55 a 2,64] | 1,29 / 0,95 | 1,14 (n=31) | sem evidência |
| s_do_mundo | 126 | 29% vs 25% | 1,12 [0,84 a 1,45] | 1,19 [0,79 a 1,79] | 1,09 / 1,16 | 1,12 (n=126) | sem evidência |
| s_da_historia | 40 | 28% vs 25% | 1,08 [0,63 a 1,68] | 1,11 [0,55 a 2,25] | 1,20 / 0,79 | 1,08 (n=40) | sem evidência |
| s_mais_adj | 14 | 57% vs 25% | 2,24 [1,28 a 3,08] | 3,97 [1,36 a 11,62] | 2,48 / 1,98 | 2,24 (n=14) | amostra pequena |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| superlativo | 1611 | 26% vs 26% | 1,00 [0,92 a 1,08] | 1,00 [0,87 a 1,14] | 1,02 / 0,98 | 1,03 (n=658) | 1,00 (n=478) | 0,95 (n=475) | sem evidência |
| s_maior | 768 | 26% vs 26% | 1,02 [0,91 a 1,15] | 1,03 [0,87 a 1,23] | 1,06 / 0,99 | 1,04 (n=323) | 1,11 (n=217) | 0,91 (n=228) | sem evidência |
| s_primeiro | 147 | 31% vs 26% | 1,19 [0,92 a 1,50] | 1,29 [0,90 a 1,84] | 0,88 / 1,31 | 1,45 (n=56) | 1,12 (n=49) | 0,92 (n=42) | sem evidência |
| s_unico | 144 | 26% vs 26% | 1,03 [0,77 a 1,33] | 1,04 [0,71 a 1,52] | 1,30 / 0,83 | 1,00 (n=54) | 0,89 (n=44) | 1,17 (n=46) | sem evidência |
| s_do_mundo | 689 | 26% vs 26% | 1,03 [0,90 a 1,16] | 1,04 [0,87 a 1,25] | 1,13 / 0,95 | 1,04 (n=273) | 0,98 (n=212) | 1,06 (n=204) | sem evidência |
| s_da_historia | 165 | 24% vs 26% | 0,92 [0,69 a 1,19] | 0,89 [0,62 a 1,28] | 0,98 / 0,85 | 0,88 (n=66) | 0,84 (n=47) | 1,04 (n=52) | sem evidência |
| s_mais_adj | 94 | 29% vs 26% | 1,12 [0,80 a 1,50] | 1,17 [0,74 a 1,83] | 1,13 / 1,11 | 0,81 (n=48) | 1,07 (n=22) | 1,77 (n=24) | sem evidência |

## sigilo

- `ninguem`: ninguém
- `quase_ninguem`: quase ninguém / pouca gente / poucos sabem
- `nunca`: nunca
- `segredo`: segredo/secreto/escondido/oculto/por trás/mistério
- `proibido`: proibido/ilegal/clandestino/banido
- `nao`: tem 'não'

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| ninguem | 514 | 26% vs 26% | 1,03 [0,89 a 1,18] | 1,05 [0,85 a 1,28] | 1,15 / 0,91 | 1,01 (n=209) | 0,73 (n=149) | 1,34 (n=156) | sem evidência |
| quase_ninguem | 417 | 26% vs 26% | 1,01 [0,86 a 1,19] | 1,02 [0,81 a 1,29] | 1,10 / 0,92 | 1,01 (n=170) | 0,74 (n=121) | 1,29 (n=126) | sem evidência |
| nunca | 185 | 17% vs 26% | 0,67 [0,49 a 0,91] | 0,59 [0,40 a 0,87] | 0,70 / 0,65 | 0,81 (n=82) | 0,64 (n=54) | 0,47 (n=49) | atrapalha (replica) |
| segredo | 249 | 22% vs 26% | 0,84 [0,66 a 1,06] | 0,78 [0,58 a 1,07] | 0,80 / 0,89 | 0,89 (n=109) | 0,62 (n=69) | 0,98 (n=71) | sem evidência |
| proibido | 50 | 42% vs 26% | 1,63 [1,14 a 2,16] | 2,08 [1,19 a 3,66] | 1,29 / 2,50 | 1,84 (n=19) | 0,97 (n=16) | 2,07 (n=15) | ajuda (replica) |
| nao | 1005 | 28% vs 25% | 1,07 [0,97 a 1,18] | 1,12 [0,96 a 1,31] | 1,08 / 1,06 | 1,08 (n=438) | 1,06 (n=287) | 1,05 (n=280) | sem evidência |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| ninguem | 514 | 41% vs 39% | 1,06 [0,95 a 1,17] | 1,03 [0,85 a 1,25] | 1,04 / 1,08 | 1,03 (n=209) | 0,88 (n=149) | 1,26 (n=156) | sem evidência |
| quase_ninguem | 417 | 42% vs 39% | 1,09 [0,97 a 1,21] | 1,06 [0,86 a 1,31] | 1,06 / 1,11 | 1,09 (n=170) | 0,84 (n=121) | 1,33 (n=126) | sem evidência |
| nunca | 185 | 31% vs 39% | 0,80 [0,64 a 0,98] | 0,71 [0,52 a 0,98] | 0,78 / 0,83 | 0,80 (n=82) | 0,81 (n=54) | 0,79 (n=49) | atrapalha (replica) |
| segredo | 249 | 33% vs 39% | 0,85 [0,71 a 1,01] | 0,80 [0,61 a 1,06] | 0,90 / 0,78 | 0,97 (n=109) | 0,67 (n=69) | 0,87 (n=71) | sem evidência |
| proibido | 50 | 58% vs 39% | 1,48 [1,13 a 1,81] | 2,29 [1,25 a 4,18] | 1,23 / 2,10 | 1,39 (n=19) | 1,37 (n=16) | 1,72 (n=15) | ajuda (replica) |
| nao | 1005 | 38% vs 39% | 0,98 [0,90 a 1,06] | 1,00 [0,86 a 1,16] | 1,03 / 0,94 | 1,04 (n=438) | 0,98 (n=287) | 0,89 (n=280) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| ninguem | 107 | 35% vs 24% | 1,38 [1,05 a 1,75] | 1,66 [1,09 a 2,54] | 1,55 / 1,12 | 1,38 (n=107) | ajuda (replica) |
| quase_ninguem | 94 | 31% vs 25% | 1,23 [0,89 a 1,63] | 1,36 [0,86 a 2,16] | 1,37 / 1,00 | 1,23 (n=94) | sem evidência |
| nunca | 29 | 24% vs 25% | 0,96 [0,49 a 1,68] | 0,94 [0,40 a 2,23] | 0,91 / 1,03 | 0,96 (n=29) | sem evidência |
| segredo | 66 | 23% vs 25% | 0,91 [0,57 a 1,36] | 0,85 [0,47 a 1,54] | 0,93 / 0,86 | 0,91 (n=66) | sem evidência |
| proibido | 12 | 33% vs 25% | 1,33 [0,55 a 2,43] | 1,46 [0,44 a 4,92] | 1,18 / 3,44 | 1,33 (n=12) | amostra pequena |
| nao | 223 | 28% vs 25% | 1,11 [0,89 a 1,36] | 1,20 [0,87 a 1,66] | 1,16 / 1,02 | 1,11 (n=223) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| ninguem | 107 | 24% vs 26% | 0,95 [0,67 a 1,30] | 0,93 [0,58 a 1,47] | 0,92 / 0,98 | 0,95 (n=107) | sem evidência |
| quase_ninguem | 94 | 24% vs 26% | 0,96 [0,66 a 1,34] | 0,94 [0,57 a 1,54] | 0,92 / 1,03 | 0,96 (n=94) | sem evidência |
| nunca | 29 | 28% vs 25% | 1,08 [0,58 a 1,79] | 1,12 [0,49 a 2,55] | 1,09 / 1,07 | 1,08 (n=29) | sem evidência |
| segredo | 66 | 21% vs 26% | 0,83 [0,51 a 1,28] | 0,77 [0,42 a 1,42] | 0,69 / 1,04 | 0,83 (n=66) | sem evidência |
| proibido | 12 | 42% vs 25% | 1,63 [0,76 a 2,67] | 2,07 [0,65 a 6,56] | 1,50 / 3,56 | 1,63 (n=12) | amostra pequena |
| nao | 223 | 27% vs 25% | 1,07 [0,86 a 1,32] | 1,12 [0,81 a 1,55] | 1,16 / 0,91 | 1,07 (n=223) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| ninguem | 561 | 25% vs 26% | 0,98 [0,85 a 1,13] | 0,98 [0,80 a 1,20] | 1,06 / 0,92 | 0,95 (n=224) | 0,81 (n=170) | 1,20 (n=167) | sem evidência |
| quase_ninguem | 412 | 24% vs 26% | 0,94 [0,79 a 1,11] | 0,92 [0,73 a 1,17] | 1,02 / 0,87 | 0,89 (n=165) | 0,79 (n=124) | 1,16 (n=123) | sem evidência |
| nunca | 203 | 19% vs 26% | 0,73 [0,54 a 0,96] | 0,65 [0,45 a 0,93] | 0,84 / 0,65 | 0,74 (n=89) | 0,73 (n=59) | 0,70 (n=55) | atrapalha (replica) |
| segredo | 296 | 23% vs 26% | 0,89 [0,72 a 1,09] | 0,85 [0,64 a 1,13] | 0,84 / 0,96 | 0,94 (n=123) | 0,73 (n=86) | 0,98 (n=87) | sem evidência |
| proibido | 53 | 36% vs 26% | 1,39 [0,94 a 1,92] | 1,61 [0,92 a 2,83] | 1,05 / 2,18 | 1,63 (n=19) | 0,69 (n=17) | 1,82 (n=17) | sem evidência |
| nao | 1232 | 28% vs 25% | 1,08 [0,98 a 1,18] | 1,14 [0,99 a 1,32] | 1,11 / 1,05 | 1,11 (n=519) | 1,10 (n=370) | 1,00 (n=343) | sem evidência |

## contraste

- `contraste`: mas / só que / porém / enquanto / mesmo assim / em vez
- `c_mas`: mas
- `c_so_que`: só que
- `c_enquanto`: enquanto (em qualquer posição)
- `c_nem`: nem
- `c_mesmo`: mesmo / até mesmo

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| contraste | 1456 | 26% vs 26% | 0,99 [0,91 a 1,08] | 0,99 [0,86 a 1,13] | 0,92 / 1,05 | 0,99 (n=628) | 0,96 (n=417) | 1,03 (n=411) | sem evidência |
| c_mas | 951 | 26% vs 26% | 1,00 [0,89 a 1,11] | 0,99 [0,85 a 1,17] | 0,99 / 1,00 | 0,99 (n=420) | 0,93 (n=266) | 1,07 (n=265) | sem evidência |
| c_so_que | 124 | 27% vs 26% | 1,03 [0,76 a 1,36] | 1,05 [0,70 a 1,58] | 0,89 / 1,09 | 1,08 (n=54) | 1,11 (n=35) | 0,89 (n=35) | sem evidência |
| c_enquanto | 277 | 26% vs 26% | 1,02 [0,83 a 1,24] | 1,03 [0,79 a 1,36] | 0,77 / 1,29 | 1,03 (n=110) | 1,06 (n=88) | 0,98 (n=79) | sem evidência |
| c_nem | 205 | 30% vs 26% | 1,15 [0,93 a 1,41] | 1,23 [0,91 a 1,67] | 0,88 / 1,39 | 1,09 (n=86) | 1,20 (n=58) | 1,21 (n=61) | sem evidência |
| c_mesmo | 275 | 24% vs 26% | 0,92 [0,74 a 1,13] | 0,89 [0,67 a 1,18] | 0,80 / 1,00 | 1,00 (n=121) | 0,97 (n=76) | 0,75 (n=78) | sem evidência |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| contraste | 1456 | 40% vs 39% | 1,02 [0,96 a 1,09] | 1,06 [0,93 a 1,20] | 1,00 / 1,05 | 1,03 (n=628) | 0,99 (n=417) | 1,04 (n=411) | sem evidência |
| c_mas | 951 | 40% vs 39% | 1,03 [0,95 a 1,11] | 1,07 [0,92 a 1,24] | 0,97 / 1,08 | 1,04 (n=420) | 0,95 (n=266) | 1,09 (n=265) | sem evidência |
| c_so_que | 124 | 40% vs 39% | 1,01 [0,80 a 1,24] | 1,03 [0,71 a 1,49] | 1,19 / 0,96 | 1,12 (n=54) | 1,18 (n=35) | 0,66 (n=35) | sem evidência |
| c_enquanto | 277 | 43% vs 39% | 1,09 [0,94 a 1,24] | 1,09 [0,84 a 1,40] | 1,03 / 1,16 | 1,08 (n=110) | 1,13 (n=88) | 1,05 (n=79) | sem evidência |
| c_nem | 205 | 43% vs 39% | 1,10 [0,93 a 1,27] | 1,09 [0,81 a 1,47] | 0,90 / 1,29 | 1,13 (n=86) | 1,05 (n=58) | 1,10 (n=61) | sem evidência |
| c_mesmo | 275 | 33% vs 39% | 0,86 [0,72 a 1,00] | 0,80 [0,62 a 1,04] | 0,88 / 0,85 | 0,87 (n=121) | 0,83 (n=76) | 0,86 (n=78) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| contraste | 317 | 27% vs 25% | 1,07 [0,89 a 1,27] | 1,11 [0,83 a 1,48] | 1,05 / 1,06 | 1,07 (n=317) | sem evidência |
| c_mas | 232 | 28% vs 24% | 1,12 [0,90 a 1,36] | 1,18 [0,86 a 1,63] | 1,14 / 1,05 | 1,12 (n=232) | sem evidência |
| c_so_que | 21 | 29% vs 25% | 1,14 [0,55 a 1,99] | 1,13 [0,43 a 2,96] | 1,44 / 0,86 | 1,14 (n=21) | sem evidência |
| c_enquanto | 47 | 21% vs 25% | 0,85 [0,48 a 1,39] | 0,80 [0,40 a 1,63] | 0,75 / 0,96 | 0,85 (n=47) | sem evidência |
| c_nem | 45 | 22% vs 25% | 0,89 [0,50 a 1,45] | 0,84 [0,41 a 1,72] | 1,04 / 0,65 | 0,89 (n=45) | sem evidência |
| c_mesmo | 53 | 15% vs 25% | 0,60 [0,31 a 1,08] | 0,50 [0,23 a 1,09] | 0,14 / 1,05 | 0,60 (n=53) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| contraste | 316 | 27% vs 25% | 1,06 [0,88 a 1,26] | 1,10 [0,82 a 1,46] | 1,07 / 1,01 | 1,06 (n=316) | sem evidência |
| c_mas | 231 | 28% vs 25% | 1,10 [0,89 a 1,34] | 1,18 [0,86 a 1,62] | 1,13 / 1,04 | 1,10 (n=231) | sem evidência |
| c_so_que | 21 | 24% vs 26% | 0,93 [0,42 a 1,77] | 0,91 [0,33 a 2,49] | 0,92 / 0,89 | 0,93 (n=21) | sem evidência |
| c_enquanto | 47 | 28% vs 25% | 1,08 [0,66 a 1,64] | 1,12 [0,58 a 2,15] | 1,14 / 0,99 | 1,08 (n=47) | sem evidência |
| c_nem | 45 | 20% vs 26% | 0,78 [0,43 a 1,33] | 0,72 [0,35 a 1,52] | 1,00 / 0,44 | 0,78 (n=45) | sem evidência |
| c_mesmo | 52 | 23% vs 26% | 0,91 [0,54 a 1,42] | 0,87 [0,45 a 1,68] | 0,57 / 1,24 | 0,91 (n=52) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| contraste | 1723 | 26% vs 26% | 1,01 [0,93 a 1,09] | 1,02 [0,89 a 1,16] | 1,01 / 1,00 | 0,95 (n=704) | 1,02 (n=519) | 1,06 (n=500) | sem evidência |
| c_mas | 1167 | 26% vs 26% | 1,02 [0,93 a 1,12] | 1,05 [0,90 a 1,21] | 1,09 / 0,96 | 0,99 (n=477) | 0,99 (n=351) | 1,10 (n=339) | sem evidência |
| c_so_que | 158 | 25% vs 26% | 0,96 [0,72 a 1,24] | 0,96 [0,67 a 1,39] | 0,80 / 1,02 | 0,85 (n=73) | 1,10 (n=43) | 1,01 (n=42) | sem evidência |
| c_enquanto | 309 | 27% vs 26% | 1,06 [0,88 a 1,26] | 1,08 [0,84 a 1,41] | 0,86 / 1,25 | 0,99 (n=113) | 1,14 (n=107) | 1,04 (n=89) | sem evidência |
| c_nem | 239 | 28% vs 26% | 1,09 [0,88 a 1,32] | 1,14 [0,85 a 1,52] | 0,81 / 1,33 | 0,90 (n=95) | 1,20 (n=69) | 1,23 (n=75) | sem evidência |
| c_mesmo | 343 | 24% vs 26% | 0,93 [0,77 a 1,12] | 0,90 [0,70 a 1,17] | 0,93 / 0,93 | 1,00 (n=151) | 0,94 (n=101) | 0,81 (n=91) | sem evidência |

## causa

- `por_causa`: por causa de
- `porque`: porque
- `o_motivo`: o motivo / e o motivo
- `e_o_motivo`: e o motivo (é...)
- `problema`: problema

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| por_causa | 140 | 31% vs 26% | 1,22 [0,94 a 1,53] | 1,33 [0,93 a 1,92] | 1,20 / 1,24 | 1,25 (n=56) | 0,84 (n=37) | 1,48 (n=47) | sem evidência |
| porque | 126 | 21% vs 26% | 0,83 [0,59 a 1,14] | 0,78 [0,51 a 1,20] | 0,54 / 0,95 | 0,94 (n=58) | 0,73 (n=37) | 0,75 (n=31) | sem evidência |
| o_motivo | 120 | 32% vs 26% | 1,23 [0,93 a 1,57] | 1,36 [0,92 a 2,02] | 1,25 / 1,22 | 1,30 (n=57) | 1,20 (n=29) | 1,14 (n=34) | sem evidência |
| e_o_motivo | 82 | 37% vs 26% | 1,42 [1,05 a 1,84] | 1,69 [1,07 a 2,67] | 1,52 / 1,37 | 1,52 (n=41) | 1,22 (n=19) | 1,41 (n=22) | ajuda (replica) |
| problema | 143 | 37% vs 26% | 1,44 [1,15 a 1,75] | 1,73 [1,22 a 2,44] | 1,81 / 1,15 | 1,49 (n=60) | 1,47 (n=42) | 1,32 (n=41) | ajuda (replica) |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| por_causa | 140 | 46% vs 39% | 1,17 [0,96 a 1,38] | 1,51 [1,05 a 2,17] | 1,19 / 1,13 | 1,13 (n=56) | 1,12 (n=37) | 1,26 (n=47) | sem evidência |
| porque | 126 | 29% vs 39% | 0,75 [0,57 a 0,97] | 0,67 [0,45 a 1,00] | 0,48 / 0,89 | 0,91 (n=58) | 0,59 (n=37) | 0,67 (n=31) | sinal sem replicação |
| o_motivo | 120 | 53% vs 39% | 1,36 [1,14 a 1,59] | 1,66 [1,15 a 2,40] | 1,66 / 1,28 | 1,39 (n=57) | 1,51 (n=29) | 1,22 (n=34) | ajuda (replica) |
| e_o_motivo | 82 | 60% vs 39% | 1,53 [1,25 a 1,78] | 2,14 [1,36 a 3,38] | 1,93 / 1,34 | 1,61 (n=41) | 1,54 (n=19) | 1,41 (n=22) | ajuda (replica) |
| problema | 143 | 55% vs 39% | 1,41 [1,20 a 1,62] | 1,84 [1,30 a 2,62] | 1,78 / 1,12 | 1,41 (n=60) | 1,51 (n=42) | 1,32 (n=41) | ajuda (replica) |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| por_causa | 31 | 35% vs 25% | 1,42 [0,84 a 2,12] | 1,53 [0,72 a 3,25] | 1,44 / 1,38 | 1,42 (n=31) | sem evidência |
| porque | 19 | 32% vs 25% | 1,26 [0,61 a 2,15] | 1,34 [0,51 a 3,54] | 1,08 / 1,25 | 1,26 (n=19) | amostra pequena |
| o_motivo | 30 | 43% vs 25% | 1,73 [1,09 a 2,42] | 2,42 [1,15 a 5,11] | 1,57 / 1,63 | 1,73 (n=30) | ajuda (replica) |
| e_o_motivo | 23 | 48% vs 25% | 1,91 [1,17 a 2,67] | 2,86 [1,23 a 6,64] | 1,92 / 1,72 | 1,91 (n=23) | ajuda (replica) |
| problema | 21 | 33% vs 25% | 1,33 [0,69 a 2,18] | 1,64 [0,65 a 4,13] | 1,44 / 1,15 | 1,33 (n=21) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| por_causa | 31 | 42% vs 25% | 1,64 [1,04 a 2,32] | 2,17 [1,04 a 4,50] | 1,57 / 1,78 | 1,64 (n=31) | ajuda (replica) |
| porque | 19 | 21% vs 26% | 0,83 [0,33 a 1,70] | 0,77 [0,26 a 2,33] | 1,03 / 0,65 | 0,83 (n=19) | amostra pequena |
| o_motivo | 30 | 40% vs 25% | 1,57 [0,96 a 2,26] | 2,00 [0,94 a 4,23] | 1,13 / 1,69 | 1,57 (n=30) | sem evidência |
| e_o_motivo | 23 | 43% vs 25% | 1,71 [1,01 a 2,48] | 2,28 [0,98 a 5,30] | 0,92 / 2,03 | 1,71 (n=23) | sinal sem replicação |
| problema | 21 | 33% vs 25% | 1,31 [0,67 a 2,14] | 1,49 [0,59 a 3,75] | 1,72 / 0,79 | 1,31 (n=21) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| por_causa | 135 | 37% vs 25% | 1,44 [1,14 a 1,77] | 1,73 [1,21 a 2,47] | 1,55 / 1,32 | 1,46 (n=53) | 1,20 (n=36) | 1,59 (n=46) | ajuda (replica) |
| porque | 304 | 24% vs 26% | 0,93 [0,76 a 1,13] | 0,91 [0,69 a 1,19] | 1,07 / 0,87 | 0,98 (n=118) | 0,89 (n=102) | 0,92 (n=84) | sem evidência |
| o_motivo | 158 | 28% vs 26% | 1,11 [0,86 a 1,40] | 1,17 [0,82 a 1,67] | 1,01 / 1,16 | 1,19 (n=65) | 1,09 (n=47) | 1,01 (n=46) | sem evidência |
| e_o_motivo | 105 | 30% vs 26% | 1,18 [0,87 a 1,55] | 1,29 [0,85 a 1,97] | 1,19 / 1,18 | 1,24 (n=47) | 1,12 (n=28) | 1,16 (n=30) | sem evidência |
| problema | 162 | 40% vs 25% | 1,56 [1,28 a 1,86] | 1,97 [1,43 a 2,71] | 1,92 / 1,32 | 1,58 (n=66) | 1,56 (n=48) | 1,53 (n=48) | ajuda (replica) |

## pessoa

- `voce`: você/vocês
- `te`: te (te contar, te mostrar)
- `seu_sua`: seu/sua (do espectador)
- `segunda_pessoa`: qualquer 2a pessoa (você, te, seu)
- `eu_nos`: eu/meu/a gente/nosso
- `pessoa_comum`: pessoa comum (estudante, agricultor, motorista, idosa, criança)
- `especialista`: cientista/pesquisador/médico/engenheiro/universidade
- `cargo_dono`: o dono / fundador / CEO / criador / herdeiro
- `bilionario`: bilionário/milionário/ficou rico

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| voce | 830 | 22% vs 26% | 0,86 [0,75 a 0,97] | 0,78 [0,66 a 0,93] | 0,84 / 0,87 | 0,88 (n=373) | 0,83 (n=234) | 0,85 (n=223) | atrapalha (replica) |
| te | 207 | 17% vs 26% | 0,67 [0,50 a 0,90] | 0,59 [0,41 a 0,85] | 0,62 / 0,73 | 0,80 (n=88) | 0,57 (n=61) | 0,60 (n=58) | atrapalha (replica) |
| seu_sua | 815 | 25% vs 26% | 0,97 [0,86 a 1,09] | 0,94 [0,80 a 1,12] | 0,94 / 0,99 | 0,85 (n=352) | 1,13 (n=237) | 0,98 (n=226) | sem evidência |
| segunda_pessoa | 1552 | 24% vs 26% | 0,94 [0,85 a 1,02] | 0,88 [0,77 a 1,01] | 0,93 / 0,94 | 0,92 (n=677) | 0,99 (n=449) | 0,90 (n=426) | sem evidência |
| eu_nos | 125 | 29% vs 26% | 1,12 [0,84 a 1,45] | 1,17 [0,79 a 1,73] | 0,81 / 1,42 | 1,11 (n=49) | 1,22 (n=38) | 1,02 (n=38) | sem evidência |
| pessoa_comum | 522 | 26% vs 26% | 1,00 [0,86 a 1,16] | 1,01 [0,80 a 1,26] | 0,94 / 1,05 | 1,10 (n=195) | 1,02 (n=167) | 0,87 (n=160) | sem evidência |
| especialista | 243 | 23% vs 26% | 0,91 [0,72 a 1,13] | 0,87 [0,63 a 1,19] | 1,04 / 0,82 | 1,08 (n=108) | 0,72 (n=75) | 0,84 (n=60) | sem evidência |
| cargo_dono | 243 | 28% vs 26% | 1,07 [0,87 a 1,30] | 1,11 [0,83 a 1,48] | 1,18 / 0,99 | 0,90 (n=117) | 1,29 (n=63) | 1,17 (n=63) | sem evidência |
| bilionario | 300 | 19% vs 26% | 0,74 [0,58 a 0,92] | 0,66 [0,49 a 0,89] | 0,80 / 0,62 | 0,73 (n=122) | 0,57 (n=89) | 0,91 (n=89) | atrapalha (replica) |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| voce | 830 | 35% vs 40% | 0,91 [0,83 a 0,99] | 0,80 [0,68 a 0,94] | 0,89 / 0,93 | 0,95 (n=373) | 0,89 (n=234) | 0,85 (n=223) | atrapalha (replica) |
| te | 207 | 31% vs 39% | 0,79 [0,64 a 0,96] | 0,60 [0,44 a 0,82] | 0,76 / 0,83 | 0,81 (n=88) | 0,76 (n=61) | 0,80 (n=58) | atrapalha (replica) |
| seu_sua | 815 | 37% vs 39% | 0,95 [0,87 a 1,04] | 0,86 [0,74 a 1,01] | 0,94 / 0,98 | 0,90 (n=352) | 1,04 (n=237) | 0,95 (n=226) | sem evidência |
| segunda_pessoa | 1552 | 36% vs 40% | 0,92 [0,86 a 0,99] | 0,81 [0,72 a 0,92] | 0,91 / 0,94 | 0,93 (n=677) | 0,95 (n=449) | 0,89 (n=426) | atrapalha (replica) |
| eu_nos | 125 | 44% vs 39% | 1,13 [0,91 a 1,35] | 1,07 [0,74 a 1,55] | 1,15 / 1,10 | 1,24 (n=49) | 0,96 (n=38) | 1,16 (n=38) | sem evidência |
| pessoa_comum | 522 | 44% vs 39% | 1,12 [1,01 a 1,23] | 1,07 [0,87 a 1,31] | 1,19 / 1,08 | 1,27 (n=195) | 1,20 (n=167) | 0,84 (n=160) | sinal sem replicação |
| especialista | 243 | 41% vs 39% | 1,04 [0,89 a 1,20] | 0,92 [0,70 a 1,22] | 1,19 / 0,95 | 1,15 (n=108) | 0,75 (n=75) | 1,25 (n=60) | sem evidência |
| cargo_dono | 243 | 42% vs 39% | 1,08 [0,93 a 1,25] | 1,12 [0,86 a 1,47] | 1,17 / 1,03 | 1,04 (n=117) | 1,16 (n=63) | 1,11 (n=63) | sem evidência |
| bilionario | 300 | 32% vs 39% | 0,83 [0,70 a 0,97] | 0,86 [0,66 a 1,11] | 0,83 / 0,79 | 0,78 (n=122) | 0,74 (n=89) | 0,99 (n=89) | sinal sem replicação |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| voce | 172 | 24% vs 25% | 0,97 [0,74 a 1,25] | 0,96 [0,66 a 1,39] | 1,00 / 0,90 | 0,97 (n=172) | sem evidência |
| te | 44 | 16% vs 25% | 0,63 [0,32 a 1,17] | 0,56 [0,25 a 1,30] | 0,72 / 0,49 | 0,63 (n=44) | sem evidência |
| seu_sua | 165 | 23% vs 25% | 0,92 [0,69 a 1,20] | 0,88 [0,60 a 1,30] | 1,00 / 0,79 | 0,92 (n=165) | sem evidência |
| segunda_pessoa | 330 | 24% vs 25% | 0,97 [0,79 a 1,16] | 0,94 [0,70 a 1,26] | 1,01 / 0,88 | 0,97 (n=330) | sem evidência |
| eu_nos | 28 | 25% vs 25% | 1,00 [0,51 a 1,73] | 1,00 [0,42 a 2,40] | 0,86 / 1,29 | 1,00 (n=28) | sem evidência |
| pessoa_comum | 58 | 28% vs 25% | 1,10 [0,71 a 1,60] | 1,24 [0,67 a 2,29] | 0,99 / 1,20 | 1,10 (n=58) | sem evidência |
| especialista | 57 | 33% vs 25% | 1,33 [0,90 a 1,85] | 1,74 [0,92 a 3,29] | 1,48 / 1,10 | 1,33 (n=57) | sem evidência |
| cargo_dono | 55 | 36% vs 25% | 1,45 [0,99 a 1,98] | 1,73 [0,98 a 3,05] | 1,35 / 1,50 | 1,45 (n=55) | sem evidência |
| bilionario | 78 | 22% vs 25% | 0,87 [0,56 a 1,28] | 0,83 [0,47 a 1,46] | 0,96 / 0,69 | 0,87 (n=78) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| voce | 172 | 24% vs 26% | 0,96 [0,73 a 1,23] | 0,94 [0,64 a 1,36] | 0,96 / 0,93 | 0,96 (n=172) | sem evidência |
| te | 44 | 18% vs 26% | 0,71 [0,37 a 1,25] | 0,63 [0,29 a 1,37] | 0,96 / 0,25 | 0,71 (n=44) | sem evidência |
| seu_sua | 165 | 25% vs 26% | 0,97 [0,74 a 1,25] | 0,96 [0,66 a 1,40] | 1,15 / 0,69 | 0,97 (n=165) | sem evidência |
| segunda_pessoa | 330 | 25% vs 26% | 1,00 [0,83 a 1,19] | 1,00 [0,75 a 1,33] | 1,11 / 0,82 | 1,00 (n=330) | sem evidência |
| eu_nos | 28 | 29% vs 25% | 1,12 [0,60 a 1,85] | 1,17 [0,51 a 2,70] | 1,03 / 1,33 | 1,12 (n=28) | sem evidência |
| pessoa_comum | 58 | 14% vs 26% | 0,54 [0,28 a 0,98] | 0,44 [0,20 a 0,95] | 0,35 / 0,77 | 0,54 (n=58) | atrapalha (replica) |
| especialista | 56 | 23% vs 26% | 0,91 [0,55 a 1,40] | 0,85 [0,43 a 1,69] | 1,09 / 0,65 | 0,91 (n=56) | sem evidência |
| cargo_dono | 55 | 31% vs 25% | 1,21 [0,80 a 1,73] | 1,31 [0,73 a 2,37] | 1,42 / 0,93 | 1,21 (n=55) | sem evidência |
| bilionario | 78 | 26% vs 25% | 1,01 [0,68 a 1,42] | 1,01 [0,59 a 1,71] | 0,92 / 1,42 | 1,01 (n=78) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| voce | 1111 | 23% vs 26% | 0,89 [0,80 a 0,99] | 0,83 [0,71 a 0,97] | 0,92 / 0,87 | 0,90 (n=475) | 0,93 (n=334) | 0,84 (n=302) | atrapalha (replica) |
| te | 311 | 20% vs 26% | 0,79 [0,63 a 0,97] | 0,72 [0,54 a 0,95] | 0,69 / 0,87 | 0,92 (n=126) | 0,74 (n=96) | 0,65 (n=89) | atrapalha (replica) |
| seu_sua | 905 | 24% vs 26% | 0,91 [0,81 a 1,03] | 0,87 [0,73 a 1,03] | 0,90 / 0,92 | 0,87 (n=386) | 1,02 (n=269) | 0,86 (n=250) | sem evidência |
| segunda_pessoa | 1911 | 24% vs 27% | 0,93 [0,86 a 1,01] | 0,87 [0,76 a 0,99] | 0,93 / 0,93 | 0,94 (n=807) | 0,97 (n=577) | 0,87 (n=527) | sem evidência |
| eu_nos | 340 | 25% vs 26% | 0,98 [0,81 a 1,17] | 0,97 [0,75 a 1,25] | 0,60 / 1,21 | 0,98 (n=138) | 1,11 (n=106) | 0,84 (n=96) | sem evidência |
| pessoa_comum | 522 | 26% vs 26% | 1,01 [0,87 a 1,16] | 1,00 [0,80 a 1,26] | 0,98 / 1,02 | 1,13 (n=192) | 1,01 (n=172) | 0,85 (n=158) | sem evidência |
| especialista | 247 | 23% vs 26% | 0,91 [0,72 a 1,13] | 0,86 [0,63 a 1,18] | 1,10 / 0,79 | 1,08 (n=108) | 0,75 (n=79) | 0,84 (n=60) | sem evidência |
| cargo_dono | 266 | 27% vs 26% | 1,04 [0,84 a 1,26] | 1,06 [0,80 a 1,41] | 1,04 / 1,03 | 0,93 (n=129) | 1,29 (n=70) | 0,98 (n=67) | sem evidência |
| bilionario | 315 | 19% vs 26% | 0,74 [0,59 a 0,92] | 0,66 [0,49 a 0,88] | 0,76 / 0,69 | 0,72 (n=129) | 0,56 (n=92) | 0,94 (n=94) | atrapalha (replica) |

## entidade

- `figura`: pessoa famosa (Musk, Trump, Lula, Neymar, Zuckerberg...)
- `elon`: Elon Musk
- `trump`: Trump
- `bigtech`: big tech (Apple, Google, Amazon, Microsoft, Meta, Nvidia, Samsung, Tesla)
- `marca_china`: marca chinesa (BYD, Shein, Shopee, Temu, Huawei, Xiaomi)
- `marca_consumo`: marca de consumo global (Coca-Cola, McDonald's, Nike, Disney, Ferrari)
- `marca_br`: marca/instituição brasileira (Petrobras, Nubank, Havan, Globo, Pix, SUS)
- `mega_marca`: qualquer marca grande (big tech + consumo + chinesa + BR)
- `china`: China/chinês
- `eua`: EUA/americano
- `pais_est`: qualquer país/lugar estrangeiro
- `brasil`: Brasil/brasileiro
- `regiao_br`: estado/cidade/região do Brasil (Nordeste, Bahia, interior, SP)
- `brasil_qualquer`: Brasil ou região BR
- `br_x_est`: Brasil (ou região) E estrangeiro no mesmo hook
- `so_est`: só estrangeiro (sem Brasil)
- `interior`: interior / cidade pequena / roça
- `governo_lei`: governo/lei/justiça/imposto/Receita/STF
- `ia`: IA / inteligência artificial / ChatGPT / robô
- `empresa_marca`: palavra 'empresa' ou 'marca' (genérica)
- `guerra`: guerra/briga/contra/rival/ataque
- `mundo`: o mundo / mundo inteiro / planeta
- `nome_proprio_qualquer`: algum nome próprio no hook
- `sem_nome_proprio`: hook sem nenhum nome próprio

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| figura | 446 | 32% vs 25% | 1,25 [1,09 a 1,43] | 1,42 [1,15 a 1,75] | 1,28 / 1,22 | 1,21 (n=190) | 1,27 (n=140) | 1,30 (n=116) | ajuda (replica) |
| elon | 124 | 33% vs 26% | 1,28 [0,99 a 1,62] | 1,44 [0,98 a 2,10] | 1,24 / 1,35 | 1,27 (n=49) | 1,32 (n=38) | 1,26 (n=37) | sem evidência |
| trump | 57 | 21% vs 26% | 0,82 [0,48 a 1,29] | 0,76 [0,39 a 1,46] | 1,13 / 0,45 | 0,49 (n=24) | 0,77 (n=20) | 1,49 (n=13) | sem evidência |
| bigtech | 644 | 26% vs 26% | 1,01 [0,89 a 1,15] | 1,02 [0,84 a 1,25] | 1,06 / 0,95 | 0,96 (n=275) | 1,01 (n=184) | 1,09 (n=185) | sem evidência |
| marca_china | 120 | 41% vs 25% | 1,58 [1,26 a 1,93] | 2,21 [1,50 a 3,26] | 1,07 / 2,07 | 1,69 (n=53) | 1,66 (n=35) | 1,33 (n=32) | ajuda (replica) |
| marca_consumo | 638 | 26% vs 26% | 1,02 [0,89 a 1,15] | 1,03 [0,85 a 1,24] | 1,17 / 0,86 | 1,01 (n=255) | 1,07 (n=188) | 0,97 (n=195) | sem evidência |
| marca_br | 313 | 29% vs 26% | 1,12 [0,93 a 1,32] | 1,19 [0,92 a 1,55] | 0,87 / 1,53 | 1,02 (n=134) | 1,32 (n=88) | 1,06 (n=91) | sem evidência |
| mega_marca | 1590 | 28% vs 25% | 1,08 [0,99 a 1,16] | 1,17 [1,02 a 1,34] | 1,08 / 1,07 | 1,03 (n=665) | 1,15 (n=459) | 1,06 (n=466) | sem evidência |
| china | 720 | 32% vs 25% | 1,22 [1,10 a 1,36] | 1,81 [1,44 a 2,28] | 1,23 / 1,22 | 1,25 (n=271) | 1,23 (n=211) | 1,19 (n=238) | ajuda (replica) |
| eua | 213 | 33% vs 26% | 1,28 [1,04 a 1,53] | 1,44 [1,07 a 1,93] | 1,05 / 1,46 | 1,08 (n=97) | 1,68 (n=60) | 1,18 (n=56) | ajuda (replica) |
| pais_est | 1132 | 31% vs 25% | 1,22 [1,12 a 1,33] | 1,63 [1,38 a 1,92] | 1,10 / 1,31 | 1,22 (n=453) | 1,30 (n=334) | 1,15 (n=345) | ajuda (replica) |
| brasil | 1507 | 27% vs 25% | 1,05 [0,97 a 1,14] | 1,10 [0,96 a 1,26] | 1,04 / 1,06 | 1,05 (n=625) | 1,07 (n=452) | 1,03 (n=430) | sem evidência |
| regiao_br | 784 | 34% vs 25% | 1,31 [1,19 a 1,44] | 1,85 [1,53 a 2,24] | 1,46 / 1,22 | 1,41 (n=318) | 1,47 (n=234) | 1,02 (n=232) | ajuda (replica) |
| brasil_qualquer | 2074 | 29% vs 24% | 1,13 [1,05 a 1,20] | 1,35 [1,19 a 1,54] | 1,14 / 1,12 | 1,15 (n=857) | 1,20 (n=623) | 1,00 (n=594) | ajuda (replica) |
| br_x_est | 393 | 36% vs 25% | 1,38 [1,20 a 1,57] | 1,70 [1,36 a 2,12] | 1,07 / 1,58 | 1,32 (n=162) | 1,52 (n=117) | 1,33 (n=114) | ajuda (replica) |
| so_est | 739 | 29% vs 25% | 1,13 [1,01 a 1,27] | 1,30 [1,07 a 1,59] | 1,11 / 1,15 | 1,16 (n=291) | 1,18 (n=217) | 1,06 (n=231) | ajuda (replica) |
| interior | 117 | 34% vs 26% | 1,33 [1,02 a 1,67] | 1,51 [1,02 a 2,24] | 1,94 / 0,98 | 1,41 (n=47) | 1,40 (n=36) | 1,14 (n=34) | sinal sem replicação |
| governo_lei | 459 | 24% vs 26% | 0,95 [0,80 a 1,11] | 0,90 [0,70 a 1,16] | 0,98 / 0,92 | 0,89 (n=215) | 0,94 (n=128) | 1,07 (n=116) | sem evidência |
| ia | 755 | 20% vs 27% | 0,78 [0,68 a 0,90] | 0,58 [0,46 a 0,73] | 0,81 / 0,75 | 0,76 (n=348) | 0,74 (n=200) | 0,86 (n=207) | atrapalha (replica) |
| empresa_marca | 830 | 21% vs 27% | 0,80 [0,70 a 0,92] | 0,71 [0,59 a 0,85] | 0,76 / 0,85 | 0,72 (n=363) | 0,82 (n=231) | 0,92 (n=236) | atrapalha (replica) |
| guerra | 364 | 34% vs 25% | 1,32 [1,14 a 1,52] | 1,54 [1,23 a 1,93] | 1,32 / 1,32 | 1,28 (n=158) | 1,33 (n=108) | 1,38 (n=98) | ajuda (replica) |
| mundo | 177 | 26% vs 26% | 1,01 [0,78 a 1,28] | 1,00 [0,71 a 1,41] | 0,82 / 1,22 | 1,05 (n=74) | 0,88 (n=57) | 1,09 (n=46) | sem evidência |
| nome_proprio_qualquer | 4315 | 28% vs 22% | 1,07 [1,02 a 1,13] | 1,41 [1,24 a 1,60] | 1,07 / 1,07 | 1,06 (n=1813) | 1,13 (n=1247) | 1,03 (n=1255) | ajuda (replica) |
| sem_nome_proprio | 1990 | 22% vs 28% | 0,84 [0,77 a 0,91] | 0,71 [0,62 a 0,81] | 0,86 / 0,82 | 0,86 (n=845) | 0,74 (n=610) | 0,93 (n=535) | atrapalha (replica) |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| figura | 446 | 43% vs 39% | 1,11 [0,99 a 1,23] | 1,26 [1,03 a 1,55] | 1,09 / 1,12 | 1,12 (n=190) | 1,08 (n=140) | 1,11 (n=116) | sem evidência |
| elon | 124 | 47% vs 39% | 1,20 [0,98 a 1,42] | 1,25 [0,86 a 1,81] | 1,05 / 1,42 | 1,24 (n=49) | 1,15 (n=38) | 1,19 (n=37) | sem evidência |
| trump | 57 | 21% vs 39% | 0,54 [0,32 a 0,85] | 0,49 [0,25 a 0,93] | 0,47 / 0,62 | 0,22 (n=24) | 0,61 (n=20) | 0,99 (n=13) | atrapalha (replica) |
| bigtech | 644 | 41% vs 39% | 1,06 [0,96 a 1,16] | 0,94 [0,78 a 1,14] | 1,10 / 0,98 | 1,02 (n=275) | 0,98 (n=184) | 1,20 (n=185) | sem evidência |
| marca_china | 120 | 44% vs 39% | 1,13 [0,91 a 1,36] | 1,90 [1,26 a 2,86] | 0,72 / 1,55 | 1,34 (n=53) | 1,39 (n=35) | 0,48 (n=32) | sem evidência |
| marca_consumo | 638 | 36% vs 39% | 0,91 [0,82 a 1,01] | 1,05 [0,88 a 1,26] | 1,03 / 0,79 | 0,89 (n=255) | 0,97 (n=188) | 0,89 (n=195) | sem evidência |
| marca_br | 313 | 37% vs 39% | 0,96 [0,82 a 1,10] | 1,02 [0,79 a 1,31] | 0,74 / 1,33 | 0,92 (n=134) | 1,05 (n=88) | 0,91 (n=91) | sem evidência |
| mega_marca | 1590 | 39% vs 39% | 1,00 [0,94 a 1,06] | 1,08 [0,95 a 1,23] | 0,99 / 1,00 | 0,98 (n=665) | 1,04 (n=459) | 0,98 (n=466) | sem evidência |
| china | 720 | 52% vs 37% | 1,34 [1,24 a 1,43] | 1,55 [1,25 a 1,94] | 1,31 / 1,37 | 1,32 (n=271) | 1,48 (n=211) | 1,22 (n=238) | ajuda (replica) |
| eua | 213 | 41% vs 39% | 1,05 [0,88 a 1,22] | 1,08 [0,80 a 1,45] | 0,82 / 1,26 | 0,90 (n=97) | 1,26 (n=60) | 1,06 (n=56) | sem evidência |
| pais_est | 1132 | 48% vs 37% | 1,24 [1,16 a 1,31] | 1,40 [1,19 a 1,65] | 1,17 / 1,30 | 1,18 (n=453) | 1,36 (n=334) | 1,18 (n=345) | ajuda (replica) |
| brasil | 1507 | 40% vs 39% | 1,01 [0,95 a 1,08] | 1,10 [0,97 a 1,25] | 0,99 / 1,04 | 1,01 (n=625) | 1,11 (n=452) | 0,90 (n=430) | sem evidência |
| regiao_br | 784 | 48% vs 38% | 1,22 [1,13 a 1,31] | 1,57 [1,31 a 1,87] | 1,39 / 1,13 | 1,38 (n=318) | 1,35 (n=234) | 0,87 (n=232) | ajuda (replica) |
| brasil_qualquer | 2074 | 42% vs 38% | 1,08 [1,03 a 1,14] | 1,31 [1,16 a 1,48] | 1,09 / 1,08 | 1,12 (n=857) | 1,20 (n=623) | 0,89 (n=594) | ajuda (replica) |
| br_x_est | 393 | 47% vs 39% | 1,21 [1,09 a 1,34] | 1,37 [1,10 a 1,70] | 1,09 / 1,32 | 1,22 (n=162) | 1,39 (n=117) | 1,00 (n=114) | ajuda (replica) |
| so_est | 739 | 49% vs 38% | 1,25 [1,16 a 1,34] | 1,26 [1,04 a 1,53] | 1,21 / 1,29 | 1,16 (n=291) | 1,35 (n=217) | 1,26 (n=231) | ajuda (replica) |
| interior | 117 | 47% vs 39% | 1,20 [0,98 a 1,43] | 1,40 [0,95 a 2,05] | 1,52 / 1,03 | 1,35 (n=47) | 1,22 (n=36) | 0,99 (n=34) | sem evidência |
| governo_lei | 459 | 39% vs 39% | 0,99 [0,88 a 1,10] | 0,83 [0,66 a 1,05] | 1,00 / 0,97 | 0,81 (n=215) | 0,99 (n=128) | 1,31 (n=116) | sem evidência |
| ia | 755 | 43% vs 38% | 1,11 [1,02 a 1,20] | 0,68 [0,56 a 0,84] | 1,16 / 1,03 | 1,05 (n=348) | 0,89 (n=200) | 1,45 (n=207) | sinal sem replicação |
| empresa_marca | 830 | 30% vs 40% | 0,78 [0,70 a 0,86] | 0,76 [0,64 a 0,90] | 0,76 / 0,79 | 0,73 (n=363) | 0,81 (n=231) | 0,81 (n=236) | atrapalha (replica) |
| guerra | 364 | 45% vs 39% | 1,15 [1,02 a 1,28] | 1,31 [1,04 a 1,64] | 1,13 / 1,18 | 1,15 (n=158) | 1,26 (n=108) | 1,00 (n=98) | ajuda (replica) |
| mundo | 177 | 40% vs 39% | 1,03 [0,85 a 1,21] | 1,01 [0,74 a 1,38] | 0,91 / 1,16 | 1,00 (n=74) | 0,94 (n=57) | 1,18 (n=46) | sem evidência |
| nome_proprio_qualquer | 4315 | 41% vs 35% | 1,04 [1,01 a 1,08] | 1,25 [1,11 a 1,41] | 1,05 / 1,04 | 1,04 (n=1813) | 1,09 (n=1247) | 1,00 (n=1255) | ajuda (replica) |
| sem_nome_proprio | 1990 | 35% vs 41% | 0,90 [0,85 a 0,96] | 0,80 [0,71 a 0,90] | 0,90 / 0,90 | 0,92 (n=845) | 0,81 (n=610) | 0,99 (n=535) | atrapalha (replica) |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| figura | 101 | 44% vs 24% | 1,74 [1,37 a 2,13] | 2,58 [1,69 a 3,93] | 1,96 / 1,40 | 1,74 (n=101) | ajuda (replica) |
| elon | 21 | 52% vs 25% | 2,09 [1,29 a 2,86] | 3,60 [1,50 a 8,67] | 2,47 / 1,48 | 2,09 (n=21) | ajuda (replica) |
| trump | 17 | 41% vs 25% | 1,64 [0,86 a 2,55] | 1,97 [0,71 a 5,43] | 2,36 / 0,57 | 1,64 (n=17) | amostra pequena |
| bigtech | 152 | 19% vs 26% | 0,76 [0,54 a 1,04] | 0,67 [0,43 a 1,05] | 0,81 / 0,69 | 0,76 (n=152) | sem evidência |
| marca_china | 22 | 32% vs 25% | 1,27 [0,65 a 2,10] | 1,72 [0,64 a 4,66] | 1,23 / 3,44 | 1,27 (n=22) | sem evidência |
| marca_consumo | 149 | 26% vs 25% | 1,04 [0,79 a 1,35] | 1,04 [0,69 a 1,57] | 1,24 / 0,72 | 1,04 (n=149) | sem evidência |
| marca_br | 82 | 23% vs 25% | 0,92 [0,61 a 1,33] | 0,92 [0,53 a 1,58] | 0,77 / 1,61 | 0,92 (n=82) | sem evidência |
| mega_marca | 374 | 23% vs 26% | 0,93 [0,77 a 1,11] | 0,87 [0,65 a 1,18] | 1,01 / 0,80 | 0,93 (n=374) | sem evidência |
| china | 61 | 48% vs 24% | 1,90 [1,42 a 2,39] | 3,01 [1,77 a 5,13] | 2,10 / 1,58 | 1,90 (n=61) | ajuda (replica) |
| eua | 45 | 47% vs 24% | 1,86 [1,31 a 2,43] | 2,69 [1,45 a 4,99] | 1,90 / 1,72 | 1,86 (n=45) | ajuda (replica) |
| pais_est | 151 | 37% vs 24% | 1,48 [1,19 a 1,80] | 1,94 [1,34 a 2,81] | 1,48 / 1,40 | 1,48 (n=151) | ajuda (replica) |
| brasil | 301 | 28% vs 24% | 1,11 [0,92 a 1,33] | 1,20 [0,88 a 1,63] | 1,08 / 1,14 | 1,11 (n=301) | sem evidência |
| regiao_br | 88 | 36% vs 24% | 1,45 [1,08 a 1,87] | 1,90 [1,19 a 3,02] | 1,76 / 1,01 | 1,45 (n=88) | ajuda (replica) |
| brasil_qualquer | 365 | 30% vs 23% | 1,21 [1,03 a 1,41] | 1,52 [1,14 a 2,02] | 1,25 / 1,13 | 1,21 (n=365) | ajuda (replica) |
| br_x_est | 61 | 46% vs 24% | 1,83 [1,36 a 2,32] | 2,69 [1,57 a 4,62] | 1,67 / 1,84 | 1,83 (n=61) | ajuda (replica) |
| so_est | 90 | 31% vs 25% | 1,24 [0,90 a 1,65] | 1,37 [0,85 a 2,20] | 1,36 / 1,06 | 1,24 (n=90) | sem evidência |
| interior | 16 | 38% vs 25% | 1,50 [0,74 a 2,45] | 1,94 [0,69 a 5,45] | 2,40 / 0,49 | 1,50 (n=16) | amostra pequena |
| governo_lei | 118 | 20% vs 26% | 0,81 [0,56 a 1,14] | 0,69 [0,41 a 1,17] | 0,80 / 0,82 | 0,81 (n=118) | sem evidência |
| ia | 167 | 17% vs 26% | 0,69 [0,49 a 0,95] | 0,48 [0,29 a 0,82] | 0,62 / 0,81 | 0,69 (n=167) | atrapalha (replica) |
| empresa_marca | 187 | 17% vs 26% | 0,68 [0,49 a 0,92] | 0,53 [0,35 a 0,80] | 0,61 / 0,78 | 0,68 (n=187) | atrapalha (replica) |
| guerra | 74 | 31% vs 25% | 1,24 [0,87 a 1,69] | 1,35 [0,81 a 2,26] | 1,44 / 0,93 | 1,24 (n=74) | sem evidência |
| mundo | 39 | 28% vs 25% | 1,12 [0,66 a 1,75] | 1,15 [0,55 a 2,37] | 1,28 / 0,86 | 1,12 (n=39) | sem evidência |
| nome_proprio_qualquer | 864 | 28% vs 19% | 1,13 [1,01 a 1,25] | 1,70 [1,27 a 2,26] | 1,14 / 1,09 | 1,13 (n=864) | ajuda (replica) |
| sem_nome_proprio | 456 | 19% vs 28% | 0,76 [0,63 a 0,91] | 0,59 [0,44 a 0,79] | 0,75 / 0,80 | 0,76 (n=456) | atrapalha (replica) |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| figura | 101 | 34% vs 25% | 1,32 [0,99 a 1,70] | 1,55 [1,00 a 2,40] | 1,68 / 0,77 | 1,32 (n=101) | sem evidência |
| elon | 21 | 33% vs 25% | 1,31 [0,67 a 2,14] | 1,48 [0,59 a 3,73] | 1,48 / 1,02 | 1,31 (n=21) | sem evidência |
| trump | 17 | 41% vs 25% | 1,62 [0,85 a 2,51] | 2,20 [0,79 a 6,12] | 2,25 / 0,59 | 1,62 (n=17) | amostra pequena |
| bigtech | 152 | 21% vs 26% | 0,83 [0,60 a 1,11] | 0,73 [0,48 a 1,13] | 0,74 / 1,07 | 0,83 (n=152) | sem evidência |
| marca_china | 22 | 23% vs 26% | 0,89 [0,40 a 1,70] | 0,91 [0,31 a 2,71] | 0,98 / 0,00 | 0,89 (n=22) | sem evidência |
| marca_consumo | 149 | 31% vs 25% | 1,21 [0,94 a 1,52] | 1,40 [0,95 a 2,07] | 1,43 / 0,82 | 1,21 (n=149) | sem evidência |
| marca_br | 82 | 28% vs 25% | 1,10 [0,76 a 1,51] | 1,18 [0,70 a 1,97] | 0,86 / 2,13 | 1,10 (n=82) | sem evidência |
| mega_marca | 374 | 26% vs 25% | 1,04 [0,87 a 1,22] | 1,09 [0,82 a 1,45] | 1,02 / 1,11 | 1,04 (n=374) | sem evidência |
| china | 61 | 33% vs 25% | 1,29 [0,88 a 1,78] | 1,47 [0,84 a 2,58] | 1,34 / 1,19 | 1,29 (n=61) | sem evidência |
| eua | 45 | 40% vs 25% | 1,57 [1,06 a 2,14] | 2,07 [1,10 a 3,88] | 1,65 / 1,42 | 1,57 (n=45) | ajuda (replica) |
| pais_est | 151 | 32% vs 25% | 1,25 [0,98 a 1,55] | 1,46 [0,99 a 2,13] | 1,21 / 1,24 | 1,25 (n=151) | sem evidência |
| brasil | 301 | 26% vs 25% | 1,03 [0,85 a 1,24] | 1,06 [0,78 a 1,44] | 1,01 / 1,04 | 1,03 (n=301) | sem evidência |
| regiao_br | 88 | 32% vs 25% | 1,25 [0,90 a 1,65] | 1,43 [0,88 a 2,32] | 1,38 / 1,05 | 1,25 (n=88) | sem evidência |
| brasil_qualquer | 365 | 28% vs 24% | 1,12 [0,95 a 1,31] | 1,28 [0,96 a 1,71] | 1,13 / 1,09 | 1,12 (n=365) | sem evidência |
| br_x_est | 61 | 38% vs 25% | 1,48 [1,04 a 1,97] | 1,89 [1,09 a 3,30] | 1,47 / 1,42 | 1,48 (n=61) | ajuda (replica) |
| so_est | 90 | 28% vs 25% | 1,09 [0,77 a 1,48] | 1,13 [0,70 a 1,85] | 1,05 / 1,09 | 1,09 (n=90) | sem evidência |
| interior | 16 | 31% vs 25% | 1,23 [0,56 a 2,18] | 1,35 [0,46 a 3,93] | 1,38 / 1,02 | 1,23 (n=16) | amostra pequena |
| governo_lei | 118 | 19% vs 26% | 0,76 [0,52 a 1,08] | 0,61 [0,36 a 1,04] | 0,65 / 0,93 | 0,76 (n=118) | sem evidência |
| ia | 167 | 19% vs 26% | 0,73 [0,53 a 0,99] | 0,49 [0,29 a 0,81] | 0,59 / 0,97 | 0,73 (n=167) | atrapalha (replica) |
| empresa_marca | 187 | 25% vs 26% | 0,96 [0,74 a 1,23] | 0,94 [0,65 a 1,36] | 1,02 / 0,86 | 0,96 (n=187) | sem evidência |
| guerra | 74 | 32% vs 25% | 1,27 [0,90 a 1,72] | 1,45 [0,87 a 2,41] | 1,46 / 0,96 | 1,27 (n=74) | sem evidência |
| mundo | 39 | 26% vs 25% | 1,01 [0,57 a 1,61] | 1,00 [0,47 a 2,10] | 0,92 / 1,19 | 1,01 (n=39) | sem evidência |
| nome_proprio_qualquer | 864 | 28% vs 20% | 1,11 [1,00 a 1,23] | 1,63 [1,23 a 2,15] | 1,09 / 1,14 | 1,11 (n=864) | sem evidência |
| sem_nome_proprio | 454 | 20% vs 28% | 0,79 [0,65 a 0,94] | 0,62 [0,46 a 0,82] | 0,83 / 0,70 | 0,79 (n=454) | atrapalha (replica) |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| figura | 438 | 32% vs 25% | 1,24 [1,08 a 1,42] | 1,41 [1,14 a 1,74] | 1,22 / 1,27 | 1,28 (n=190) | 1,23 (n=147) | 1,18 (n=101) | ajuda (replica) |
| elon | 120 | 33% vs 26% | 1,30 [0,99 a 1,64] | 1,47 [1,00 a 2,16] | 1,30 / 1,29 | 1,35 (n=46) | 1,21 (n=39) | 1,32 (n=35) | sem evidência |
| trump | 56 | 20% vs 26% | 0,76 [0,44 a 1,24] | 0,70 [0,36 a 1,38] | 1,01 / 0,54 | 0,32 (n=24) | 0,83 (n=19) | 1,48 (n=13) | sem evidência |
| bigtech | 577 | 26% vs 26% | 1,02 [0,88 a 1,16] | 1,03 [0,84 a 1,27] | 1,06 / 0,97 | 1,01 (n=242) | 0,97 (n=178) | 1,08 (n=157) | sem evidência |
| marca_china | 110 | 38% vs 26% | 1,48 [1,15 a 1,85] | 1,90 [1,26 a 2,86] | 1,07 / 1,94 | 1,51 (n=54) | 1,67 (n=40) | 0,96 (n=16) | ajuda (replica) |
| marca_consumo | 623 | 26% vs 26% | 1,02 [0,89 a 1,16] | 1,04 [0,86 a 1,27] | 1,20 / 0,86 | 0,99 (n=249) | 1,07 (n=191) | 1,01 (n=183) | sem evidência |
| marca_br | 319 | 30% vs 25% | 1,18 [1,00 a 1,39] | 1,32 [1,02 a 1,70] | 0,95 / 1,54 | 1,06 (n=139) | 1,44 (n=96) | 1,10 (n=84) | sem evidência |
| mega_marca | 1516 | 28% vs 25% | 1,09 [1,01 a 1,18] | 1,20 [1,05 a 1,38] | 1,10 / 1,09 | 1,04 (n=635) | 1,18 (n=469) | 1,09 (n=412) | ajuda (replica) |
| china | 726 | 31% vs 25% | 1,22 [1,09 a 1,36] | 1,81 [1,44 a 2,28] | 1,29 / 1,17 | 1,20 (n=272) | 1,20 (n=217) | 1,27 (n=237) | ajuda (replica) |
| eua | 222 | 32% vs 25% | 1,26 [1,03 a 1,51] | 1,41 [1,06 a 1,89] | 1,02 / 1,45 | 1,02 (n=99) | 1,65 (n=62) | 1,27 (n=61) | ajuda (replica) |
| pais_est | 1164 | 31% vs 24% | 1,22 [1,12 a 1,33] | 1,64 [1,39 a 1,94] | 1,16 / 1,26 | 1,18 (n=461) | 1,28 (n=351) | 1,22 (n=352) | ajuda (replica) |
| brasil | 1554 | 26% vs 25% | 1,03 [0,95 a 1,12] | 1,06 [0,92 a 1,21] | 1,03 / 1,03 | 1,03 (n=642) | 1,04 (n=474) | 1,02 (n=438) | sem evidência |
| regiao_br | 792 | 34% vs 24% | 1,32 [1,20 a 1,46] | 1,86 [1,54 a 2,24] | 1,45 / 1,25 | 1,42 (n=321) | 1,51 (n=238) | 1,01 (n=233) | ajuda (replica) |
| brasil_qualquer | 2100 | 29% vs 24% | 1,12 [1,05 a 1,20] | 1,34 [1,17 a 1,53] | 1,14 / 1,11 | 1,15 (n=863) | 1,18 (n=638) | 1,02 (n=599) | ajuda (replica) |
| br_x_est | 402 | 36% vs 25% | 1,41 [1,23 a 1,60] | 1,75 [1,41 a 2,18] | 1,21 / 1,52 | 1,35 (n=161) | 1,56 (n=124) | 1,35 (n=117) | ajuda (replica) |
| so_est | 762 | 29% vs 25% | 1,12 [1,00 a 1,25] | 1,28 [1,05 a 1,56] | 1,14 / 1,10 | 1,10 (n=300) | 1,13 (n=227) | 1,15 (n=235) | ajuda (replica) |
| interior | 121 | 35% vs 26% | 1,35 [1,04 a 1,69] | 1,55 [1,06 a 2,28] | 1,90 / 1,05 | 1,47 (n=50) | 1,45 (n=38) | 1,05 (n=33) | ajuda (replica) |
| governo_lei | 488 | 24% vs 26% | 0,92 [0,78 a 1,07] | 0,85 [0,67 a 1,09] | 0,91 / 0,92 | 0,91 (n=222) | 0,91 (n=138) | 0,93 (n=128) | sem evidência |
| ia | 737 | 19% vs 27% | 0,75 [0,65 a 0,87] | 0,55 [0,44 a 0,70] | 0,84 / 0,65 | 0,70 (n=339) | 0,80 (n=207) | 0,81 (n=191) | atrapalha (replica) |
| empresa_marca | 920 | 21% vs 27% | 0,82 [0,72 a 0,92] | 0,72 [0,60 a 0,86] | 0,78 / 0,85 | 0,76 (n=390) | 0,78 (n=271) | 0,92 (n=259) | atrapalha (replica) |
| guerra | 400 | 34% vs 25% | 1,33 [1,16 a 1,52] | 1,56 [1,26 a 1,94] | 1,39 / 1,29 | 1,30 (n=173) | 1,35 (n=117) | 1,37 (n=110) | ajuda (replica) |
| mundo | 196 | 30% vs 26% | 1,17 [0,94 a 1,43] | 1,24 [0,91 a 1,70] | 1,06 / 1,27 | 1,09 (n=78) | 1,19 (n=63) | 1,26 (n=55) | sem evidência |
| nome_proprio_qualquer | 4256 | 27% vs 22% | 1,07 [1,01 a 1,12] | 1,38 [1,21 a 1,57] | 1,07 / 1,06 | 1,06 (n=1798) | 1,13 (n=1242) | 1,02 (n=1216) | ajuda (replica) |
| sem_nome_proprio | 1842 | 22% vs 27% | 0,85 [0,78 a 0,92] | 0,73 [0,64 a 0,83] | 0,86 / 0,84 | 0,86 (n=753) | 0,72 (n=561) | 0,96 (n=528) | atrapalha (replica) |

## palavra

- `vida_sonho`: vida / sonho / felicidade
- `hype_adj`: adjetivo de hype (insano, absurdo, genial, bizarro, inacreditável)
- `historia_palavra`: palavra 'história'

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| vida_sonho | 167 | 13% vs 26% | 0,51 [0,34 a 0,74] | 0,42 [0,27 a 0,67] | 0,51 / 0,51 | 0,53 (n=74) | 0,58 (n=47) | 0,42 (n=46) | atrapalha (replica) |
| hype_adj | 350 | 24% vs 26% | 0,92 [0,76 a 1,10] | 0,88 [0,68 a 1,14] | 1,23 / 0,75 | 0,82 (n=152) | 0,90 (n=103) | 1,10 (n=95) | sem evidência |
| historia_palavra | 287 | 26% vs 26% | 1,01 [0,83 a 1,22] | 1,02 [0,78 a 1,35] | 1,01 / 1,02 | 0,96 (n=122) | 1,03 (n=83) | 1,09 (n=82) | sem evidência |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| vida_sonho | 167 | 31% vs 39% | 0,78 [0,62 a 0,97] | 0,63 [0,45 a 0,88] | 0,79 / 0,77 | 0,78 (n=74) | 0,72 (n=47) | 0,84 (n=46) | atrapalha (replica) |
| hype_adj | 350 | 41% vs 39% | 1,04 [0,91 a 1,17] | 0,93 [0,74 a 1,18] | 1,11 / 1,02 | 0,92 (n=152) | 1,16 (n=103) | 1,09 (n=95) | sem evidência |
| historia_palavra | 287 | 39% vs 39% | 0,99 [0,85 a 1,14] | 1,13 [0,87 a 1,47] | 1,04 / 0,94 | 0,97 (n=122) | 1,20 (n=83) | 0,79 (n=82) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| vida_sonho | 34 | 24% vs 25% | 0,94 [0,50 a 1,60] | 0,92 [0,41 a 2,06] | 1,18 / 0,57 | 0,94 (n=34) | sem evidência |
| hype_adj | 67 | 25% vs 25% | 1,01 [0,66 a 1,47] | 1,04 [0,59 a 1,85] | 0,99 / 0,97 | 1,01 (n=67) | sem evidência |
| historia_palavra | 58 | 24% vs 25% | 0,96 [0,60 a 1,46] | 0,91 [0,49 a 1,69] | 0,90 / 1,15 | 0,96 (n=58) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| vida_sonho | 34 | 21% vs 26% | 0,81 [0,41 a 1,44] | 0,75 [0,32 a 1,74] | 1,13 / 0,30 | 0,81 (n=34) | sem evidência |
| hype_adj | 67 | 27% vs 25% | 1,05 [0,70 a 1,51] | 1,08 [0,62 a 1,88] | 0,94 / 1,11 | 1,05 (n=67) | sem evidência |
| historia_palavra | 58 | 29% vs 25% | 1,15 [0,75 a 1,65] | 1,23 [0,68 a 2,20] | 1,34 / 0,71 | 1,15 (n=58) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| vida_sonho | 191 | 15% vs 26% | 0,59 [0,42 a 0,81] | 0,50 [0,33 a 0,75] | 0,56 / 0,61 | 0,65 (n=77) | 0,67 (n=59) | 0,42 (n=55) | atrapalha (replica) |
| hype_adj | 438 | 24% vs 26% | 0,93 [0,79 a 1,10] | 0,90 [0,72 a 1,13] | 1,16 / 0,80 | 0,80 (n=189) | 0,92 (n=128) | 1,15 (n=121) | sem evidência |
| historia_palavra | 356 | 26% vs 26% | 1,02 [0,85 a 1,20] | 1,02 [0,80 a 1,31] | 0,86 / 1,12 | 1,03 (n=143) | 1,02 (n=108) | 0,99 (n=105) | sem evidência |

## forma

- `pal_ate12`: hook <= 12 palavras
- `pal_13_17`: hook 13 a 17 palavras
- `pal_18_22`: hook 18 a 22 palavras
- `pal_23_27`: hook 23 a 27 palavras
- `pal_28_34`: hook 28 a 34 palavras
- `pal_35mais`: hook >= 35 palavras
- `frases_1`: 1 frase
- `frases_2`: 2 frases
- `frases_3mais`: 3+ frases
- `frase_longa`: alguma frase com 25+ palavras
- `termina_pergunta`: termina em pergunta
- `tem_pergunta`: tem pergunta
- `reticencias`: termina em reticências
- `exclamacao`: tem exclamação
- `virgula_0`: sem vírgula
- `virgula_2mais`: 2+ vírgulas
- `dois_pontos`: tem dois-pontos
- `aspas`: tem aspas

### coef
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| pal_ate12 | 686 | 27% vs 26% | 1,06 [0,94 a 1,20] | 1,11 [0,92 a 1,33] | 1,07 / 1,06 | 1,14 (n=264) | 1,01 (n=211) | 1,03 (n=211) | sem evidência |
| pal_13_17 | 1487 | 25% vs 26% | 0,97 [0,88 a 1,05] | 0,94 [0,82 a 1,08] | 0,93 / 1,03 | 0,93 (n=593) | 0,94 (n=464) | 1,05 (n=430) | sem evidência |
| pal_18_22 | 1829 | 26% vs 26% | 1,01 [0,93 a 1,09] | 1,01 [0,89 a 1,15] | 1,09 / 0,92 | 1,00 (n=785) | 1,03 (n=534) | 0,99 (n=510) | sem evidência |
| pal_23_27 | 1289 | 26% vs 26% | 1,03 [0,94 a 1,12] | 1,04 [0,91 a 1,20] | 0,88 / 1,13 | 1,06 (n=552) | 0,98 (n=374) | 1,01 (n=363) | sem evidência |
| pal_28_34 | 811 | 24% vs 26% | 0,93 [0,82 a 1,05] | 0,89 [0,75 a 1,06] | 1,11 / 0,86 | 0,94 (n=361) | 0,97 (n=227) | 0,89 (n=223) | sem evidência |
| pal_35mais | 203 | 28% vs 26% | 1,09 [0,87 a 1,34] | 1,13 [0,82 a 1,55] | 0,79 / 1,16 | 0,94 (n=103) | 1,48 (n=47) | 1,02 (n=53) | sem evidência |
| frases_1 | 4130 | 26% vs 25% | 1,01 [0,96 a 1,06] | 1,04 [0,92 a 1,18] | 1,01 / 1,01 | 1,03 (n=1687) | 0,98 (n=1261) | 1,02 (n=1182) | sem evidência |
| frases_2 | 2010 | 25% vs 26% | 0,99 [0,91 a 1,06] | 0,97 [0,86 a 1,10] | 0,98 / 0,99 | 0,95 (n=889) | 1,06 (n=560) | 0,97 (n=561) | sem evidência |
| frases_3mais | 165 | 24% vs 26% | 0,94 [0,71 a 1,22] | 0,92 [0,63 a 1,33] | 0,84 / 0,99 | 1,00 (n=82) | 0,86 (n=36) | 0,91 (n=47) | sem evidência |
| frase_longa | 636 | 27% vs 26% | 1,06 [0,93 a 1,19] | 1,08 [0,90 a 1,30] | 0,89 / 1,13 | 1,12 (n=267) | 1,06 (n=194) | 0,95 (n=175) | sem evidência |
| termina_pergunta | 216 | 27% vs 26% | 1,04 [0,83 a 1,29] | 1,06 [0,77 a 1,45] | 0,89 / 1,14 | 0,89 (n=79) | 1,08 (n=68) | 1,18 (n=69) | sem evidência |
| tem_pergunta | 307 | 28% vs 26% | 1,09 [0,90 a 1,29] | 1,13 [0,87 a 1,48] | 1,08 / 1,09 | 1,09 (n=125) | 1,14 (n=85) | 1,04 (n=97) | sem evidência |
| reticencias | 114 | 26% vs 26% | 1,02 [0,74 a 1,36] | 1,04 [0,68 a 1,58] | 1,07 / 0,88 | 0,66 (n=47) | 1,48 (n=34) | 1,06 (n=33) | sem evidência |
| exclamacao | 328 | 30% vs 26% | 1,18 [1,00 a 1,38] | 1,29 [1,01 a 1,64] | 1,04 / 1,33 | 1,20 (n=143) | 1,14 (n=92) | 1,21 (n=93) | sem evidência |
| virgula_0 | 3487 | 26% vs 25% | 1,02 [0,96 a 1,07] | 1,06 [0,94 a 1,18] | 1,03 / 1,00 | 1,01 (n=1433) | 1,01 (n=1042) | 1,03 (n=1012) | sem evidência |
| virgula_2mais | 840 | 24% vs 26% | 0,92 [0,81 a 1,04] | 0,88 [0,74 a 1,04] | 0,95 / 0,90 | 0,93 (n=365) | 0,85 (n=241) | 0,98 (n=234) | sem evidência |
| dois_pontos | 361 | 27% vs 26% | 1,05 [0,89 a 1,24] | 1,08 [0,85 a 1,38] | 1,00 / 1,10 | 1,05 (n=145) | 1,08 (n=107) | 1,03 (n=109) | sem evidência |
| aspas | 130 | 24% vs 26% | 0,93 [0,67 a 1,24] | 0,89 [0,59 a 1,34] | 0,40 / 1,23 | 0,78 (n=50) | 1,23 (n=41) | 0,79 (n=39) | sem evidência |

### acerto
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| pal_ate12 | 686 | 41% vs 39% | 1,04 [0,95 a 1,14] | 1,06 [0,89 a 1,26] | 0,98 / 1,15 | 1,04 (n=264) | 1,05 (n=211) | 1,04 (n=211) | sem evidência |
| pal_13_17 | 1487 | 39% vs 39% | 0,99 [0,93 a 1,06] | 0,94 [0,83 a 1,07] | 0,96 / 1,01 | 1,00 (n=593) | 0,92 (n=464) | 1,06 (n=430) | sem evidência |
| pal_18_22 | 1829 | 39% vs 39% | 1,01 [0,95 a 1,07] | 1,05 [0,93 a 1,18] | 1,06 / 0,96 | 1,02 (n=785) | 1,02 (n=534) | 0,97 (n=510) | sem evidência |
| pal_23_27 | 1289 | 39% vs 39% | 1,00 [0,93 a 1,07] | 0,97 [0,85 a 1,11] | 0,95 / 1,05 | 1,01 (n=552) | 1,01 (n=374) | 0,97 (n=363) | sem evidência |
| pal_28_34 | 811 | 38% vs 39% | 0,97 [0,89 a 1,06] | 0,99 [0,84 a 1,16] | 1,12 / 0,94 | 0,95 (n=361) | 1,03 (n=227) | 0,95 (n=223) | sem evidência |
| pal_35mais | 203 | 36% vs 39% | 0,93 [0,77 a 1,11] | 1,03 [0,76 a 1,40] | 0,82 / 1,00 | 0,84 (n=103) | 1,09 (n=47) | 0,97 (n=53) | sem evidência |
| frases_1 | 4130 | 40% vs 38% | 1,01 [0,98 a 1,05] | 1,02 [0,91 a 1,15] | 0,99 / 1,03 | 1,03 (n=1687) | 0,98 (n=1261) | 1,03 (n=1182) | sem evidência |
| frases_2 | 2010 | 38% vs 40% | 0,98 [0,92 a 1,03] | 0,99 [0,88 a 1,11] | 1,03 / 0,96 | 0,95 (n=889) | 1,06 (n=560) | 0,93 (n=561) | sem evidência |
| frases_3mais | 165 | 36% vs 39% | 0,93 [0,75 a 1,12] | 0,93 [0,67 a 1,31] | 0,96 / 0,94 | 0,93 (n=82) | 0,74 (n=36) | 1,10 (n=47) | sem evidência |
| frase_longa | 636 | 41% vs 39% | 1,04 [0,95 a 1,14] | 1,04 [0,87 a 1,24] | 0,99 / 1,09 | 1,09 (n=267) | 1,07 (n=194) | 0,94 (n=175) | sem evidência |
| termina_pergunta | 216 | 43% vs 39% | 1,10 [0,94 a 1,27] | 1,06 [0,79 a 1,43] | 0,80 / 1,33 | 0,93 (n=79) | 1,32 (n=68) | 1,05 (n=69) | sem evidência |
| tem_pergunta | 307 | 42% vs 39% | 1,08 [0,95 a 1,23] | 1,06 [0,82 a 1,36] | 0,87 / 1,23 | 0,99 (n=125) | 1,32 (n=85) | 0,99 (n=97) | sem evidência |
| reticencias | 114 | 35% vs 39% | 0,90 [0,69 a 1,13] | 0,94 [0,62 a 1,41] | 0,80 / 1,12 | 0,73 (n=47) | 1,15 (n=34) | 0,86 (n=33) | sem evidência |
| exclamacao | 328 | 35% vs 39% | 0,90 [0,78 a 1,04] | 0,97 [0,76 a 1,23] | 0,75 / 1,08 | 0,98 (n=143) | 0,95 (n=92) | 0,75 (n=93) | sem evidência |
| virgula_0 | 3487 | 39% vs 39% | 1,00 [0,96 a 1,04] | 1,00 [0,90 a 1,11] | 1,00 / 0,99 | 1,02 (n=1433) | 0,99 (n=1042) | 0,99 (n=1012) | sem evidência |
| virgula_2mais | 840 | 39% vs 39% | 0,99 [0,90 a 1,07] | 0,97 [0,83 a 1,14] | 1,06 / 0,96 | 1,02 (n=365) | 0,97 (n=241) | 0,96 (n=234) | sem evidência |
| dois_pontos | 361 | 46% vs 39% | 1,18 [1,05 a 1,32] | 1,06 [0,85 a 1,33] | 1,20 / 1,17 | 1,20 (n=145) | 1,02 (n=107) | 1,33 (n=109) | sinal sem replicação |
| aspas | 130 | 36% vs 39% | 0,93 [0,73 a 1,14] | 0,79 [0,54 a 1,17] | 0,41 / 1,27 | 0,84 (n=50) | 0,95 (n=41) | 0,99 (n=39) | sem evidência |

### ret_hook (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| pal_ate12 | 167 | 16% vs 26% | 0,64 [0,45 a 0,90] | 0,53 [0,34 a 0,83] | 0,74 / 0,33 | 0,64 (n=167) | atrapalha (replica) |
| pal_13_17 | 340 | 23% vs 26% | 0,91 [0,75 a 1,10] | 0,87 [0,65 a 1,18] | 1,00 / 0,77 | 0,91 (n=340) | sem evidência |
| pal_18_22 | 369 | 27% vs 24% | 1,08 [0,91 a 1,27] | 1,16 [0,88 a 1,52] | 1,14 / 0,98 | 1,08 (n=369) | sem evidência |
| pal_23_27 | 253 | 24% vs 25% | 0,96 [0,77 a 1,19] | 0,93 [0,67 a 1,30] | 0,81 / 1,09 | 0,96 (n=253) | sem evidência |
| pal_28_34 | 152 | 34% vs 24% | 1,34 [1,06 a 1,65] | 1,53 [1,06 a 2,20] | 1,46 / 1,15 | 1,34 (n=152) | ajuda (replica) |
| pal_35mais | 39 | 36% vs 25% | 1,43 [0,91 a 2,06] | 1,63 [0,83 a 3,20] | 1,18 / 1,35 | 1,43 (n=39) | sem evidência |
| frases_1 | 890 | 23% vs 30% | 0,91 [0,81 a 1,03] | 0,69 [0,52 a 0,91] | 0,97 / 0,85 | 0,91 (n=890) | sem evidência |
| frases_2 | 392 | 29% vs 23% | 1,17 [1,00 a 1,36] | 1,40 [1,06 a 1,85] | 1,11 / 1,15 | 1,17 (n=392) | sem evidência |
| frases_3mais | 38 | 32% vs 25% | 1,26 [0,76 a 1,89] | 1,33 [0,66 a 2,69] | 0,96 / 1,38 | 1,26 (n=38) | sem evidência |
| frase_longa | 114 | 28% vs 25% | 1,12 [0,82 a 1,47] | 1,16 [0,75 a 1,78] | 1,19 / 0,98 | 1,12 (n=114) | sem evidência |
| termina_pergunta | 34 | 21% vs 25% | 0,82 [0,41 a 1,47] | 0,74 [0,32 a 1,73] | 0,96 / 0,49 | 0,82 (n=34) | sem evidência |
| tem_pergunta | 51 | 31% vs 25% | 1,25 [0,81 a 1,80] | 1,35 [0,73 a 2,48] | 1,23 / 1,29 | 1,25 (n=51) | sem evidência |
| reticencias | 34 | 18% vs 25% | 0,70 [0,33 a 1,34] | 0,64 [0,27 a 1,54] | 0,86 / 0,38 | 0,70 (n=34) | sem evidência |
| exclamacao | 77 | 12% vs 26% | 0,47 [0,25 a 0,83] | 0,38 [0,19 a 0,77] | 0,43 / 0,51 | 0,47 (n=77) | atrapalha (replica) |
| virgula_0 | 749 | 23% vs 28% | 0,92 [0,81 a 1,05] | 0,80 [0,62 a 1,03] | 0,91 / 1,00 | 0,92 (n=749) | sem evidência |
| virgula_2mais | 162 | 25% vs 25% | 0,98 [0,75 a 1,27] | 0,96 [0,65 a 1,42] | 0,96 / 0,96 | 0,98 (n=162) | sem evidência |
| dois_pontos | 84 | 19% vs 25% | 0,76 [0,48 a 1,15] | 0,69 [0,39 a 1,22] | 0,68 / 0,84 | 0,76 (n=84) | sem evidência |
| aspas | 27 | 26% vs 25% | 1,03 [0,53 a 1,78] | 0,99 [0,41 a 2,39] | 0,51 / 1,72 | 1,03 (n=27) | sem evidência |

### ret_sub (Instagram)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | leitura |
|---|---|---|---|---|---|---|---|
| pal_ate12 | 167 | 19% vs 26% | 0,75 [0,55 a 1,01] | 0,65 [0,43 a 0,98] | 0,79 / 0,68 | 0,75 (n=167) | sem evidência |
| pal_13_17 | 340 | 22% vs 27% | 0,85 [0,69 a 1,04] | 0,75 [0,55 a 1,01] | 0,88 / 0,85 | 0,85 (n=340) | sem evidência |
| pal_18_22 | 369 | 29% vs 24% | 1,13 [0,96 a 1,32] | 1,27 [0,97 a 1,66] | 1,09 / 1,18 | 1,13 (n=369) | sem evidência |
| pal_23_27 | 252 | 27% vs 25% | 1,07 [0,87 a 1,30] | 1,13 [0,82 a 1,54] | 1,00 / 1,13 | 1,07 (n=252) | sem evidência |
| pal_28_34 | 151 | 31% vs 25% | 1,22 [0,95 a 1,53] | 1,37 [0,94 a 1,99] | 1,61 / 0,90 | 1,22 (n=151) | sem evidência |
| pal_35mais | 39 | 21% vs 26% | 0,80 [0,42 a 1,39] | 0,75 [0,34 a 1,64] | 1,13 / 0,64 | 0,80 (n=39) | sem evidência |
| frases_1 | 889 | 23% vs 30% | 0,92 [0,81 a 1,03] | 0,70 [0,53 a 0,92] | 0,87 / 1,06 | 0,92 (n=889) | sem evidência |
| frases_2 | 391 | 29% vs 24% | 1,13 [0,97 a 1,32] | 1,30 [0,99 a 1,71] | 1,32 / 0,90 | 1,13 (n=391) | sem evidência |
| frases_3mais | 38 | 39% vs 25% | 1,55 [1,00 a 2,17] | 1,99 [1,01 a 3,91] | 1,84 / 1,25 | 1,55 (n=38) | ajuda (replica) |
| frase_longa | 114 | 25% vs 26% | 0,96 [0,69 a 1,30] | 0,95 [0,61 a 1,48] | 1,07 / 0,83 | 0,96 (n=114) | sem evidência |
| termina_pergunta | 34 | 18% vs 26% | 0,69 [0,33 a 1,31] | 0,61 [0,25 a 1,50] | 0,46 / 1,52 | 0,69 (n=34) | sem evidência |
| tem_pergunta | 51 | 22% vs 26% | 0,85 [0,49 a 1,36] | 0,79 [0,40 a 1,57] | 0,59 / 1,33 | 0,85 (n=51) | sem evidência |
| reticencias | 34 | 26% vs 25% | 1,04 [0,57 a 1,69] | 1,05 [0,49 a 2,28] | 1,16 / 0,79 | 1,04 (n=34) | sem evidência |
| exclamacao | 77 | 25% vs 26% | 0,97 [0,64 a 1,39] | 0,96 [0,56 a 1,64] | 0,91 / 1,05 | 0,97 (n=77) | sem evidência |
| virgula_0 | 748 | 23% vs 28% | 0,92 [0,80 a 1,04] | 0,77 [0,60 a 0,99] | 0,88 / 1,05 | 0,92 (n=748) | sem evidência |
| virgula_2mais | 161 | 22% vs 26% | 0,88 [0,65 a 1,15] | 0,81 [0,55 a 1,21] | 1,07 / 0,64 | 0,88 (n=161) | sem evidência |
| dois_pontos | 84 | 29% vs 25% | 1,12 [0,79 a 1,53] | 1,19 [0,72 a 1,96] | 1,21 / 0,97 | 1,12 (n=84) | sem evidência |
| aspas | 27 | 30% vs 25% | 1,16 [0,62 a 1,90] | 1,24 [0,53 a 2,90] | 0,73 / 1,78 | 1,16 (n=27) | sem evidência |

### coef com o hook FALADO (hook_video)
| característica | n vídeos | % topo com vs sem | lift [IC95] | OR MH [IC95] | lift descoberta / validação | Instagram | TikTok | YouTube | leitura |
|---|---|---|---|---|---|---|---|---|---|
| pal_ate12 | 283 | 23% vs 26% | 0,88 [0,70 a 1,08] | 0,83 [0,62 a 1,11] | 0,91 / 0,78 | 0,82 (n=142) | 0,76 (n=62) | 1,07 (n=79) | sem evidência |
| pal_13_17 | 941 | 25% vs 26% | 0,97 [0,87 a 1,08] | 0,95 [0,81 a 1,12] | 0,95 / 1,02 | 0,99 (n=387) | 0,93 (n=272) | 0,99 (n=282) | sem evidência |
| pal_18_22 | 1423 | 26% vs 26% | 1,02 [0,93 a 1,11] | 1,03 [0,90 a 1,18] | 1,01 / 1,02 | 1,02 (n=607) | 1,07 (n=403) | 0,95 (n=413) | sem evidência |
| pal_23_27 | 1290 | 27% vs 25% | 1,05 [0,96 a 1,15] | 1,10 [0,95 a 1,26] | 0,94 / 1,15 | 1,11 (n=532) | 0,96 (n=377) | 1,06 (n=381) | sem evidência |
| pal_28_34 | 1145 | 24% vs 26% | 0,92 [0,83 a 1,02] | 0,87 [0,75 a 1,02] | 0,97 / 0,89 | 0,94 (n=473) | 0,90 (n=350) | 0,91 (n=322) | sem evidência |
| pal_35mais | 1016 | 27% vs 25% | 1,06 [0,96 a 1,17] | 1,11 [0,95 a 1,29] | 1,29 / 0,96 | 0,96 (n=410) | 1,16 (n=339) | 1,08 (n=267) | sem evidência |
| frases_1 | 2924 | 25% vs 26% | 0,97 [0,91 a 1,03] | 0,92 [0,82 a 1,04] | 0,97 / 0,97 | 1,01 (n=1119) | 0,96 (n=912) | 0,94 (n=893) | sem evidência |
| frases_2 | 2461 | 27% vs 25% | 1,04 [0,98 a 1,11] | 1,10 [0,98 a 1,24] | 1,03 / 1,05 | 1,00 (n=1093) | 1,05 (n=681) | 1,10 (n=687) | sem evidência |
| frases_3mais | 713 | 25% vs 26% | 0,97 [0,85 a 1,10] | 0,96 [0,80 a 1,15] | 1,07 / 0,93 | 0,98 (n=339) | 1,01 (n=210) | 0,89 (n=164) | sem evidência |
| frase_longa | 1006 | 25% vs 26% | 0,97 [0,87 a 1,07] | 0,94 [0,81 a 1,11] | 1,04 / 0,92 | 1,03 (n=336) | 0,94 (n=365) | 0,94 (n=305) | sem evidência |
| termina_pergunta | 156 | 29% vs 26% | 1,15 [0,89 a 1,44] | 1,22 [0,86 a 1,73] | 1,03 / 1,22 | 1,40 (n=61) | 1,14 (n=52) | 0,81 (n=43) | sem evidência |
| tem_pergunta | 399 | 26% vs 26% | 1,01 [0,86 a 1,19] | 1,02 [0,81 a 1,30] | 1,04 / 1,00 | 1,01 (n=172) | 1,03 (n=118) | 0,99 (n=109) | sem evidência |
| reticencias | 8 | 38% vs 26% | 1,46 [0,53 a 2,70] | 1,71 [0,41 a 7,24] | 0,00 / 1,66 | 0,00 (n=1) | 1,97 (n=2) | 1,54 (n=5) | amostra pequena |
| exclamacao | 83 | 31% vs 26% | 1,22 [0,87 a 1,63] | 1,33 [0,82 a 2,16] | 1,41 / 0,78 | 1,37 (n=48) | 1,01 (n=35) | - (n=0) | sem evidência |
| virgula_0 | 2889 | 26% vs 25% | 1,03 [0,97 a 1,09] | 1,07 [0,95 a 1,20] | 1,03 / 1,03 | 1,10 (n=1152) | 0,98 (n=865) | 0,98 (n=872) | sem evidência |
| virgula_2mais | 1147 | 23% vs 26% | 0,89 [0,80 a 0,99] | 0,83 [0,72 a 0,97] | 0,96 / 0,86 | 0,91 (n=508) | 0,91 (n=363) | 0,85 (n=276) | atrapalha (replica) |
| dois_pontos | 107 | 26% vs 26% | 1,02 [0,73 a 1,37] | 1,03 [0,67 a 1,59] | 0,84 / 1,11 | 1,04 (n=52) | 0,98 (n=48) | 1,10 (n=7) | sem evidência |
| aspas | 29 | 38% vs 26% | 1,47 [0,88 a 2,18] | 1,74 [0,82 a 3,69] | 0,00 / 1,53 | 1,43 (n=19) | 1,48 (n=8) | 1,93 (n=2) | amostra pequena |
