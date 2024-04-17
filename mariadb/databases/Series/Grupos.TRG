TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`%` TRIGGER `AntesDeBorrarGrupo` BEFORE DELETE ON `Grupos` FOR EACH ROW BEGIN\n  DELETE FROM Usuario_Grupo2 WHERE ID_Grupo = OLD.ID_Grupo;\nEND'
sql_modes=524288
definers='root@%'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_general_ci'
db_cl_names='utf8mb4_general_ci'
created=1711642899709229
