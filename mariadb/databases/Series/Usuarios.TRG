TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`%` TRIGGER `eliminar_usuario_cascada` BEFORE DELETE ON `Usuarios` FOR EACH ROW BEGIN\n    DELETE FROM Visualizaciones WHERE ID_Usuario = OLD.Id;\n    DELETE FROM Usuario_Grupo2 WHERE ID_Usuario = OLD.Id;\n    DELETE FROM Series WHERE ID_Usuario = OLD.Id;\n    DELETE FROM ComentariosSerie WHERE id_usuario = OLD.Id;\n    -- Aquí añades las sentencias DELETE para otras tablas relacionadas\nEND'
sql_modes=1411383296
definers='root@%'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_unicode_ci'
db_cl_names='utf8mb4_general_ci'
created=1712848040618219
