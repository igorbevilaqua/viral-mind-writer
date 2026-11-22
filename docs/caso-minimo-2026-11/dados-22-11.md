# Números lidos do banco em 22/11/2026 (SELECT só leitura, Viral Data qclvrddrqulgfzccndnl e CRM adtnxhxjgpdqehuxrvzl)

## Uso do Codex (vm_sessions + vm_attachments.is_modelagem; modo null = modelar, 'replicar' = replicar)
| mês | sessões | usuários | modelar (com roteiro) | replicar | outros (livre, fontes, carrossel; com roteiro) |
| jul | 22 | 2 | 4 (3) | 0 | 18 (16) |
| ago | 106 | 6 | 45 (30) | 8 | 53 (50) |
| set | 76 | 5 | 23 (15) | 15 | 38 (33) |
| out | 80 | 4 | 27 (24) | 13 | 40 (39) |
| nov (até 22) | 5 | 3 | 3 (3) | 1 | 1 (1) |
| total | 289 | 6 | 102 (75) | 37 | 150 (139) |
Sessões por semana: 12/10 = 40; 19/10 = 16; 26/10 = 6; 02/11 = 4; 09/11 = 1; 16/11 = 0. Última sessão: 11/11/2026.

## Roteiros do Codex e vínculo com vídeo
- 307 roteiros em 247 sessões; 82 sem cliente.
- 60 casados com roteiro do CRM (crm_script_id); 51 com published_url colado à mão.
- 47 roteiros com vídeo confirmado em vm_script_matches, 134 vídeos (120 maduros); 29 casamentos pendentes. Último casamento: 16/11 (ETL semanal rodando).
- Por mês de criação do roteiro (roteiros / no CRM / com vídeo): jul 21/2/2; ago 106/37/28; set 88/14/12; out 84/6/5; nov 8/1/0.
- Por fluxo, com vídeo: modelar 20, replicar 4, outros 23.
- Os 134 vídeos somam 7.563.784 views; só 27 têm seguidores_ganhos (soma 4.012). Coeficiente viral mediano 1,565; 38 de 134 'acerto'.
- Por cliente (roteiros/vídeos): Túlio 9/21, Renato Mendes 7/21, Marcos Pelozato 4/18, Fernando Pereira 6/11, Pedro Elero 3/9, Leonardo Cirino 4/5, Patrick Diorio 4/4, outros 1 a 2 cada.
- vm_script_performance: 51 linhas; vm_outcomes: 49.

## Preditor em modo sombra (vm_preditor_sombra, versão preditor-v0-2026-10_openai)
- 128 linhas, 17 gerações de 12 sessões, última em 11/11. Hooks: 17 gerações, 6 candidatos em média; a escolha da sala coincidiu com o top 1 do preditor em 7 de 17. Narrativas: 9 gerações, coincidiu em 2 de 9. Nenhuma dessas 17 gerações tem vídeo casado ainda, então a acurácia nos candidatos do Codex não é medível.
- vm_preditor_rotulos: 8.631 vídeos da casa, 8.055 com pq medido (topo = pq >= 0,75), atualizado 16/11. Por mês (medidos/topo/clientes): jun 950/248/20; jul 999/224/22; ago 1.060/253/24; set 1.208/338/23; out 1.178/301/22; nov parcial 316/95/19.
- vm_roteiro_modo: 2.832 roteiros rotulados.

## Volume da casa (oraculo.fato_video, vm_script='sim'), por semana
semana: vídeos VM / clientes / com seguidores_ganhos / com retenção
31/08: 270/21/55/57; 07/09: 300/23/76/78; 14/09: 311/23/62/63; 21/09: 306/21/66/69; 28/09: 254/21/47/49; 05/10: 282/21/42/46; 12/10: 294/21/41/42; 19/10: 308/20/36/35; 26/10: 279/19/40/40; 02/11: 296/21/39/38; 09/11: 257/19/19/18; 16/11: 240/19/0/0 (maturando).
CRM (scripts criados/postados): jun 495/389; jul 588/440; ago 685/521; set 767/545; out 584/305; nov 413/130 (postagem com latência). CRM não tem campo estruturado de referência/modelagem (client_references sem links).

## Por cliente, últimas 8 semanas (vídeos VM; com seguidores; acertos)
Izabela Anholett 227; 10; 77 | Lincoln Fracari 191; 0; 43 | Marcio Grazino 170; 25; 48 | Thiago Bisewski 169; 102; 42 | Renato Mendes 159; 0; 39 | Rafael Rodrigues 155; 0; 43 | Ricardo Schumacher 146; 0; 21 | Túlio 127; 19; 13 | Rodrigo Waughan 119; 62; 6 | Thainá Iansen 117; 13; 27 | Fernando Pereira 98; 1; 52 | Pedro Elero (inativo) 88 | Marcos Pelozato (inativo) 76.

## Outros
- oraculo.pedido_modelagem: 2 pedidos, ambos 'pendente', de 21/09.
- Branches locais NÃO enviadas ao GitHub: plano-025-skills-modo (Task C avaliador de pauta e Task D conferência mensal do plano 026, "release 2.7"), plano-027-modelagem (modelador de uma chamada, portões, banco de prova; 12/11) com 2 arquivos modificados sem commit. origin só tem main e plano/013.
- Pedro Elero e Marcos Pelozato cancelaram em 22/11: os dados deles valem para análise e treino, mas nada se planeja para eles.
