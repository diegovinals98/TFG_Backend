TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`%` TRIGGER `eliminar_registros_relacionados` AFTER DELETE ON `Series` FOR EACH ROW BEGIN
sql_modes=524288
definers='root@%'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_general_ci'
db_cl_names='utf8mb4_general_ci'
created=1711642899759325