const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const http = require('http');
const nodemailer = require('nodemailer');
const cors = require('cors');
const WebSocket = require('ws');
const { Server } = require('socket.io');


const app = express();

const server = http.createServer(app); // servidor HTTP común para ambos
const wss = new WebSocket.Server({ server }); // WebSocket sobre ese servidor

app.use(express.json()); // Para analizar application/json

app.use(cors()); // Permite todos los orígenes

console.log('Conectando...')

// Crear conexión a la base de datos
const db = mysql.createConnection({
  host: '192.168.1.113', // La IP interna del contenedor MariaDB
  user: 'diego', // El usuario de la base de datos
  password: '27101998', // La contraseña de la base de datos
  database: 'Series2', // El nombre de tu base de datos
  charset: 'utf8mb4'
});

const dbBoda = mysql.createConnection({
  host: '192.168.1.113', // La IP interna del contenedor MariaDB
  user: 'diego', // El usuario de la base de datos
  password: '27101998', // La contraseña de la base de datos
  database: 'BodaSofiaDiego', // El nombre de tu base de datos
  charset: 'utf8mb4'
});


const io = new Server(http, {
  cors: {
    origin: '*', // Puedes restringirlo si quieres
    methods: ['GET', 'POST']
  }
});


// Conectar a la base de datos
db.connect((err) => {
  if(err) {
    console.log('----- ERROR -----')
    throw err;
  }
  const now = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  console.log(`Conectado a BBDD Series - ${now.toLocaleDateString('es-ES', options)}`);
});


// Conectar a la base de datos
dbBoda.connect((err) => {
  if(err) {
    console.log('----- ERROR -----')
    throw err;
  }
  const now = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  console.log(`Conectado a BBDD BODA - ${now.toLocaleDateString('es-ES', options)}`);
});


// Lista para almacenar los clientes conectados
const clients = new Set();


app.use(cors()); // Permite todos los orígenes


app.get('/admin/health', (req, res) => {
  res.send('Hello World');
});


wss.on('connection', (ws) => {
  console.log('📡 Nuevo cliente conectado a WebSocket');
  clients.add(ws);
  console.log('🔗 Clientes conectados actualmente:', clients.size);

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('📩 Mensaje recibido vía WebSocket:', parsedMessage);

      if (parsedMessage.tipo === 'nuevo_invitado') {
        console.log("Tipo socket nuevo invitado");
        insertarInvitado(parsedMessage.data, null, ws);
      }
    } catch (error) {
      console.error('❌ Error al parsear mensaje WebSocket:', error, 'Mensaje recibido:', message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ Cliente desconectado, clientes restantes:', clients.size);
  });
});



// ✅ GET /invitados - Obtener todos
app.get('/invitados', (req, res) => {

  console.log("Seleccion de todos los invitados");
  dbBoda.query('SELECT * FROM invitados', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener invitados' });
    }
    console.log("Resulados: " + results);
    res.json(results);
  });
});

const insertarInvitado = (data, res = null, ws = null) => {
  const {
    nombre_completo,
    asistira,
    numero_acompanantes,
    restricciones,
    asistencia_autobus,
    mensaje_para_novios
  } = data;

  const query = `
    INSERT INTO invitados (
      nombre_completo, asistira, numero_acompanantes,
      restricciones, asistencia_autobus, mensaje_para_novios
    ) VALUES (?, ?, ?, ?, ?, ?)`;

  dbBoda.query(query, [
    nombre_completo,
    asistira,
    numero_acompanantes,
    restricciones,
    asistencia_autobus,
    mensaje_para_novios
  ], (err, result) => {
    if (err) {
      const mensjae_error = JSON.stringify({ tipo: 'confimracion', data: "not ok" });
      clients.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(mensjae_error));
      console.error('❌ Error al guardar invitado:', err);
      if (res) res.status(500).json({ error: 'Error al guardar invitado' });
      return;
    }

    const nuevoInvitado = {
      id: result.insertId,
      nombre_completo,
      asistira,
      numero_acompanantes,
      restricciones,
      asistencia_autobus,
      mensaje_para_novios
    };

    const confirmacion = JSON.stringify({ tipo: 'confimracion', data: "ok" });
    clients.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(confirmacion));

    // ✅ Emitir el mensaje por WebSocket nativo
    const mensaje = JSON.stringify({ tipo: 'nuevo_invitado', data: nuevoInvitado });
    clients.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(mensaje));

    console.log('✅ Nuevo invitado agregado y emitido por WebSocket:', nuevoInvitado);

    if (res) {
      res.status(201).json({ id: result.insertId, message: 'Invitado guardado con éxito 🎉' });
    }
  });
};



app.post('/apple-login', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const sql = 'SELECT * FROM Usuarios WHERE Usuario = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error al buscar usuario con Apple ID:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = results[0];
    res.json({ usuario });
  });
});




app.post('/login2', (req, res) => {
  let usuario = req.body.usuario;
  //let contraseña = req.body.contraseña; // Asegúrate de que esto coincida con el nombre de campo en tu base de datos

  console.log("Usuario: " + usuario);
  //console.log("Contraseña: " + contraseña);
  let sql = 'SELECT * FROM Usuarios WHERE Usuario = ? ';
  db.query(sql, [usuario], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al verificar el usuario');
    }
    if (results.length > 0) {
      // Usuario encontrado y contraseña correcta
      console.log('Inicio de sesión exitoso:')
      
      // Envía los datos del usuario en la respuesta
      let user = results[0]; // asumiendo que el usuario es único
      let hashPassword = user.Contraseña; // Obtener el hash de la contraseña
      console.log(user)
      res.json({ success: 1, usuario: user, hashPassword: hashPassword});
      
    } else {
      // Usuario no encontrado o contraseña incorrecta
      console.log('Usuario o contraseña incorrectos');
      res.json({ success: 0 });
    }
  });
});


app.get('/get-user/:id', (req, res) => {
  // Recupera el id del usuario desde el parámetro de la URL
  const userId = req.params.id;

  // Consulta SQL para obtener toda la información del usuario con el id proporcionado
  const sql = 'SELECT * FROM Usuarios WHERE Id = ?';

  // Ejecutar la consulta SQL
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error al consultar la base de datos:", err);
      return res.status(500).send('Error al consultar la base de datos');
    }

    
    // Si se encuentra un usuario con el id proporcionado
    if (results.length > 0) {
      console.log(results);
      const user = results[0]; // Como el id es único, el primer resultado es el usuario
      res.json({
        success: 1,
        usuario: user
      });
    } else {
      // Si no se encuentra el usuario, se envía un mensaje indicando que no existe
      res.json({ success: 0, message: "Usuario no encontrado" });
    }
  });
});



app.get('/usuario', (req, res) => {
  console.log("llamado a Usuario")
  let sql = 'SELECT * FROM Usuarios';
  db.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
  });
});


app.get('/usuario/:nombreUsuario', (req, res) => {
  const { nombreUsuario } = req.params;
  console.log(`Buscando información para el usuario: ${nombreUsuario}`);
  
  let sql = 'SELECT * FROM Usuarios WHERE Usuario = ?';
  db.query(sql, [nombreUsuario], (err, results) => {
    if (err) {
      console.error('Error al buscar el usuario:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('Usuario encontrado:', results[0]);
    res.json(results[0]);
  });
});


app.put('/usuario/:id', (req, res) => {
  const { id } = req.params;
  const { newNombre, newApellidos, newUsuario, newContrasena } = req.body;

  let sql = `UPDATE Usuarios SET Nombre = ?, Apellidos = ?, Usuario = ?, Contraseña = ? WHERE Id = ?`;
  db.query(sql, [newNombre, newApellidos, newUsuario, newContrasena, id], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error al actualizar el usuario');
    } else {
      console.log('Datos del usuario actualizados:', result);
      res.send('Datos del usuario actualizados correctamente.');
    }
  });
});


app.post('/usuario', (req, res) => {
  console.log("Añadiendo un nuevo usuario");
  
  // Verificar si el nombre de usuario ya existe
  let username = req.body.Usuario;
  console.log("Usuario a añadir: " + username)
  let sqlCheckUsername = 'SELECT * FROM Usuarios WHERE Usuario = ?';
  db.query(sqlCheckUsername, username, (err, rows) => {
    if (err) throw err;
    // Si se encuentra algún usuario con el mismo nombre de usuario
    if (rows.length > 0) {
      mensaje = 'El nombre de usuario ya está en uso'
      console.log(mensaje)
      res.json({success: 0, message: mensaje});
    
    } else {
      // Si no se encuentra ningún usuario con el mismo nombre de usuario, procede a añadir el nuevo usuario
      let nuevoUsuario = {
        Id: req.body.Id,
        Nombre: req.body.Nombre,
        Usuario: req.body.Usuario,
        Contraseña: req.body.Contraseña,
        Apellidos: req.body.Apellidos
      };

      let sqlInsertUsuario = 'INSERT INTO Usuarios SET ?';
      db.query(sqlInsertUsuario, nuevoUsuario, (err, result) => {
        if (err) throw err;
        mensaje = 'Usuario añadido con exito'
        console.log(mensaje)
        res.json({success: 1, message: mensaje});
      });
    }
  });
});


app.get('/check-device-id/:deviceId', (req, res) => {

  console.log("Buscando a ver si existe el device id para un usuario");

  // Recupera el parámetro 'id' de la URL
  let deviceId = req.params.deviceId;
  console.log("El device id que se esta buscando es: ", deviceId);

  // Consulta SQL con parámetro seguro
  let sql = "SELECT IdUsuario FROM DeviceTokens WHERE DeviceToken = ?";
  
  // Ejecuta la consulta, pasando el valor del deviceId como parámetro
  db.query(sql, [deviceId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error en la base de datos");
      return;
    }
   
    if (results.length > 0) {
      // Devuelve el IdUsuario si se encontró el deviceId
      console.log("Resultado de la busqueda: ",  results[0].IdUsuario );
      res.json({ IdUsuario: results[0].IdUsuario });
    } else {
      // Si no se encontró, devuelve un mensaje indicando que no existe
      res.status(404).json({ message: "Device ID no encontrado", results: results });
    }
  });
  
});


app.post('/insert-device-id', (req, res) => {
  const { userId, deviceId } = req.body; // Obtener deviceId y userId del cuerpo de la solicitud
  console.log("Id del usuario: ", userId);
  console.log("Token del dispositivo: " , deviceId);

  if (!deviceId || !userId) {
    return res.status(400).send('Device ID y User ID son requeridos');
  }

  console.log("Insertando Device ID y User ID:", deviceId, userId);

  // Consulta SQL para insertar el Device ID y el User ID
  const sql = "INSERT INTO DeviceTokens (IdUsuario, DeviceToken) VALUES (?, ?)";

  db.query(sql, [userId, deviceId], (err, results) => {
    if (err) {
      console.error('Error al insertar en la base de datos:', err);
      return res.status(500).send('Error al insertar el Device ID y User ID en la base de datos');
    }

    console.log('Inserción exitosa:', results);
    res.json({ message: 'Device ID y User ID insertados correctamente', insertId: results.insertId });
  });
});

app.post('/delete-device-id', (req, res) => {
  const { userId, deviceId } = req.body;

  if (!userId || !deviceId) {
    return res.status(400).send('User ID y Device ID son requeridos');
  }

  console.log("Eliminando el Device ID:", deviceId, "para el Usuario ID:", userId);

  // Consulta SQL para eliminar el deviceId
  const sql = "DELETE FROM DeviceTokens WHERE IdUsuario = ? AND DeviceToken = ?";

  db.query(sql, [userId, deviceId], (err, result) => {
    if (err) {
      console.error('Error al eliminar el Device ID:', err);
      return res.status(500).send('Error al eliminar el Device ID de la base de datos');
    }

    console.log('Device ID eliminado exitosamente:', result);
    res.json({ message: 'Device ID eliminado correctamente' });
  });
});




app.get('/usuario_grupo', (req, res) => {
  console.log("llamado a Usuario_Grupo")
  let sql = 'SELECT * FROM Usuario_Grupo2';
  db.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
  });
});


app.get('/grupos/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log("Llamado a grupos para el usuario:", userId);

  // Ajusta esta consulta SQL según tu esquema de base de datos
  let sql = `SELECT Grupos.* FROM Grupos
             JOIN Usuario_Grupo2 ON Grupos.ID_Grupo = Usuario_Grupo2.ID_Grupo
             WHERE Usuario_Grupo2.ID_Usuario = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).send('Error en el servidor');
      return;
    }
    console.log(results);
    res.send(results);
  });
});


app.get('/series-ids-usuario/:userId/:grupoId', (req, res) => {
  // Extraemos el userId del parámetro de ruta y el grupoId del parámetro de ruta
  const userId = req.params.userId;
  const groupId = req.params.grupoId;

  // Registrando en consola el inicio del proceso
  console.log("Llamado para obtener los IDs de series para el usuario:", userId);
  console.log("Para el grupo con ID:", groupId);

  // Consulta SQL para obtener los IDs de usuarios que pertenecen al grupo
  let sqlGetUsersInGroup = `SELECT ID_Usuario FROM Usuario_Grupo2 WHERE ID_Grupo = ?`;

  // Ejecución de la consulta para obtener los usuarios del grupo
  db.query(sqlGetUsersInGroup, [groupId], (usersErr, usersResults) => {
    if (usersErr) {
      // En caso de error al obtener usuarios, devolver un error 500
      console.error('Error en la consulta de usuarios del grupo:', usersErr);
      res.status(500).send('Error al obtener los usuarios del grupo');
      return;
    }

    // Extracción de los IDs de los usuarios del resultado de la consulta
    const userIds = usersResults.map(row => row.ID_Usuario);
    console.log(`Usuarios en el grupo ${groupId}:`, userIds);

    // Si hay usuarios en el grupo, procedemos a buscar las series en común
    if (userIds.length > 0) {
      // Creación de placeholders para la consulta SQL (un '?' por cada ID de usuario)
      let placeholders = userIds.map(() => '?').join(',');

      // Consulta SQL para obtener los IDs de series que todos los usuarios tienen en común
      let sqlGetCommonSeries = `
        SELECT ID_Serie 
        FROM Series 
        WHERE ID_Usuario IN (${placeholders}) 
        GROUP BY ID_Serie 
        HAVING COUNT(DISTINCT ID_Usuario) = ?
      `;

      // Ejecución de la consulta para obtener las series en común
      db.query(sqlGetCommonSeries, [...userIds, userIds.length], (seriesErr, seriesResults) => {
        if (seriesErr) {
          // En caso de error al obtener las series, devolver un error 500
          console.error('Error al obtener las series comunes:', seriesErr);
          res.status(500).send('Error al obtener las series comunes');
          return;
        }

        // Extracción de los IDs de series en común del resultado de la consulta
        const commonSeriesIds = seriesResults.map(row => row.ID_Serie);
        console.log(`Series comunes para los usuarios en el grupo ${groupId}:`, commonSeriesIds);
        
        // Devolvemos los IDs de las series comunes como respuesta JSON
        res.json(commonSeriesIds);
      });
    } else {
      // Si no hay usuarios en el grupo, devolvemos un error 404
      res.status(404).send('No hay usuarios en el grupo');
    }
  });
});



app.post('/agregar-serie-usuario', (req, res) => {
  const userId = req.body.userId;
  const idSerie = req.body.idSerie;
  const idGrupo = req.body.idGrupo; // Asegúrate de recibir el ID del grupo --**  VER

  console.log(`Solicitud para agregar la serie con ID ${idSerie} al grupo ${idGrupo} y luego al usuario ${userId}`);

  // Primero, verifica si la serie ya está asociada con el grupo
  let sqlCheckGrupo = `SELECT * FROM Series_Grupos WHERE ID_Grupo = ? AND ID_Serie = ?`;

  db.query(sqlCheckGrupo, [idGrupo, idSerie], (groupCheckErr, groupCheckResults) => {
    if (groupCheckErr) {
      console.error('Error al verificar la serie en el grupo:', groupCheckErr);
      return res.status(500).send('Error al verificar la serie en el grupo');
    }

    if (groupCheckResults.length > 0) {
      // Si la serie ya está asociada con el grupo
      console.log(`La serie con ID ${idSerie} ya está asociada con el grupo ${idGrupo}`);
    } else {
      // Insertar la serie en el grupo
      let sqlInsertGrupo = `INSERT INTO Series_Grupos (ID_Grupo, ID_Serie) VALUES (?, ?)`;

      db.query(sqlInsertGrupo, [idGrupo, idSerie], (insertGroupErr, insertGroupResults) => {
        if (insertGroupErr) {
          console.error('Error al insertar la serie en el grupo:', insertGroupErr);
          return res.status(500).send('Error al insertar la serie en el grupo');
        }

        console.log(`Serie con ID ${idSerie} agregada al grupo ${idGrupo}`);
      });
    }

    // Ahora verificamos si la serie ya está asociada con el usuario
    let sqlCheckUsuario = `SELECT * FROM Series WHERE ID_Usuario = ? AND ID_Serie = ?`;

    db.query(sqlCheckUsuario, [userId, idSerie], (userCheckErr, userCheckResults) => {
      if (userCheckErr) {
        console.error('Error en la consulta:', userCheckErr);
        return res.status(500).send('Error en el servidor');
      }

      if (userCheckResults.length > 0) {
        // Si la serie ya está asociada con el usuario
        console.log(`La serie con ID ${idSerie} ya existe para el usuario ${userId}`);
        res.status(409).send(`La serie ya existe para el usuario`);
      } else {
        // Si no existe, inserta la serie para el usuario
        let sqlInsertUsuario = `INSERT INTO Series (ID_Usuario, ID_Serie) VALUES (?, ?)`;

        db.query(sqlInsertUsuario, [userId, idSerie], (insertErr, insertResults) => {
          if (insertErr) {
            console.error('Error al insertar:', insertErr);
            return res.status(500).send('Error al insertar en el servidor');
          }

          console.log(`Serie con ID ${idSerie} agregada al usuario ${userId}`);
          res.status(200).send(`Serie agregada exitosamente al grupo ${idGrupo} y al usuario ${userId}`);
        });
      }
    });
  });
});

app.get('/series-grupo/:idGrupo', (req, res) => {
  const idGrupo = req.params.idGrupo;

  console.log(`Buscando series para el grupo ${idGrupo}`);

  // Consulta para obtener las series asociadas al grupo
  let sql = `
    SELECT S.ID_Serie, S.Nombre_Serie 
    FROM Series S
    JOIN Series_Grupos SG ON S.ID_Serie = SG.ID_Serie
    WHERE SG.ID_Grupo = ?
  `;

  db.query(sql, [idGrupo], (err, results) => {
    if (err) {
      console.error('Error al consultar las series del grupo:', err);
      return res.status(500).send('Error al consultar las series del grupo');
    }

    if (results.length > 0) {
      console.log(`Series encontradas para el grupo ${idGrupo}:`, results);
      res.json(results);
    } else {
      console.log(`No se encontraron series para el grupo ${idGrupo}`);
      res.status(404).send('No se encontraron series para el grupo');
    }
  });
});

app.delete('/eliminar-serie-usuario', (req, res) => {
  const userId = req.body.userId;
  const idSerie = req.body.idSerie;

  console.log(`Solicitud para eliminar la serie con ID ${idSerie} del usuario ${userId}`);

  // Consulta SQL para eliminar la serie del usuario
  let sqlDelete = `DELETE FROM Series WHERE ID_Usuario = ? AND ID_Serie = ?`;

  try{
    db.query(sqlDelete, [userId, idSerie], (err, result) => {
    if (err) {
      console.error('Error al eliminar la serie:', err);
      res.status(500).send('Error al eliminar en el servidor');
      return;
    }
    if (result.affectedRows > 0) {
      // Si se ha eliminado alguna fila, significa que la eliminación fue exitosa
      console.log(`Serie con ID ${idSerie} eliminada del usuario ${userId}`);
      res.json({ message: `Serie eliminada exitosamente del usuario ${userId}` });
      // Elimina esta línea ↓
      // navia
    } else {
      // Si no se eliminó ninguna fila, significa que la serie no estaba asociada con el usuario
      console.log(`La serie con ID ${idSerie} no existe para el usuario ${userId}`);
      res.status(404).send(`La serie no existe para el usuario`);
    }
    
  });
  }catch (error) {
    res.status(500).send('Error al consultar la base de datos');
  }
  
});


app.post('/agregar-visualizacion', (req, res) => {
  const { idSerie, capituloId, Name, Episode_number, season_number, userid } = req.body;

  // Verificar si el capítulo ya existe
  const capituloExisteSql = "SELECT * FROM Capitulo WHERE ID_Capitulo = ?";
  db.query(capituloExisteSql, [capituloId], (err, results) => {
    if (err) {
      console.error('Error al verificar el capítulo:', err);
      res.status(500).send('Error al verificar el capítulo');
      return;
    }
    // Si el capítulo no existe, insertarlo
    if (results.length === 0) {
      const insertarCapituloSql = "INSERT INTO Capitulo (ID_Capitulo, ID_Serie, Numero_Temporada, Nombre_Capitulo, Numero_Capitulo) VALUES (?, ?, ?, ?, ?)";
      db.query(insertarCapituloSql, [capituloId, idSerie, season_number, Name, Episode_number], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error al insertar el capítulo:', insertErr);
          res.status(500).send('Error al insertar el capítulo');
          return;
        }
        // Si se inserta el capítulo, entonces agregar la visualización
        agregarVisualizacion(userid, capituloId, res);
      });
    } else {
      // Si el capítulo ya existe, entonces agregar la visualización
      agregarVisualizacion(userid, capituloId, res);
    }
  });
});


function agregarVisualizacion(userId, capituloId, res) {
  const fechaActual = new Date();
  const insertarVisualizacionSql = "INSERT INTO Visualizaciones (ID_Usuario, ID_Capitulo, Fecha_Visualizacion) VALUES (?, ?, ?)";
  db.query(insertarVisualizacionSql, [userId, capituloId, fechaActual], (err, results) => {
    if (err) {
      console.error('Error al insertar la visualización:', err);
      res.status(500).send('Error al insertar la visualización');
    } else {
      res.send({ message: 'Visualizacion agregada con exito' });
      console.log('Visualizacion agregada con exito')
    }
  });
}


app.post('/eliminar-visualizacion', (req, res) => {
  const { capituloId, userid } = req.body;

  // Verificar si la visualización existe
  const visualizacionExisteSql = "SELECT * FROM Visualizaciones WHERE ID_Capitulo = ? AND ID_Usuario = ?";
  db.query(visualizacionExisteSql, [capituloId, userid], (err, results) => {
    if (err) {
      console.error('Error al verificar la visualización:', err);
      res.send({ message: 'Error al verificar la visualización' });
      return;
    }
    // Si la visualización existe, eliminarla
    if (results.length > 0) {
      const eliminarVisualizacionSql = "DELETE FROM Visualizaciones WHERE ID_Capitulo = ? AND ID_Usuario = ?";
      db.query(eliminarVisualizacionSql, [capituloId, userid], (deleteErr, deleteResults) => {
        if (deleteErr) {
          console.error('Error al eliminar la visualización:', deleteErr);
          res.send({ message: 'Error al eliminar la visualización' });
          return;
        }
        console.log('Eliminado existosamente')
        res.send({ message: 'Visualización eliminada exitosamente' });
      });
    } else {
      // Si la visualización no existe, enviar mensaje
      res.send({ message: 'Visualización no encontrada' });
    }
  });
});



app.get('/temporada-vista/:userId/:idSerie/:season_number', async (req, res) => {
  const { userId, idSerie, season_number } = req.params;

  //res.json({ message: 'Entrando en el endpoint temporada-vista' });
  try {
    const sql = `
    SELECT C.ID_Capitulo
    FROM Capitulo C
    INNER JOIN Visualizaciones V ON C.ID_Capitulo = V.ID_Capitulo AND V.ID_Usuario = ?
    WHERE C.ID_Serie = ? AND C.Numero_Temporada = ?
    `;
    const capitulosVistos = await new Promise((resolve, reject) => {
      db.query(sql, [userId, idSerie, season_number], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Devuelve una lista de los ID de los capítulos que han sido vistos.
    const capitulosVistosIds = capitulosVistos.map(row => row.ID_Capitulo);
    res.json({ vistos: capitulosVistosIds });
  } catch (error) {
    res.status(500).send('Error al consultar la base de datos');
  }
});


app.get('/serie/:idSerie/usuarios', (req, res) => {
  const { idSerie } = req.params;

  let sql = `
    SELECT 
        U.Id,
        U.Nombre,
        U.Apellidos,
        U.Usuario,
        MAX(V.Fecha_Visualizacion) AS Ultima_Visualizacion,
        C.Nombre_Capitulo,
        C.Numero_Capitulo
    FROM 
        Usuarios U
    JOIN 
        Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
    JOIN 
        Visualizaciones V ON U.id = V.ID_Usuario
    JOIN 
        Capitulo C ON V.ID_Capitulo = C.ID_Capitulo AND C.ID_Serie = ?
    WHERE 
        EXISTS (
            SELECT 1
            FROM 
                Series S
            WHERE 
                S.ID_Serie = C.ID_Serie AND 
                S.ID_Serie = ? 
        )
    GROUP BY 
        U.id, C.Nombre_Capitulo, C.Numero_Capitulo
    ORDER BY 
        Ultima_Visualizacion DESC;
  `;

  db.query(sql, [idSerie, idSerie], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en la base de datos');
    }
    
    res.json(results);
    console.log(results)
  });
});

app.get('/usuarios-viendo-serie/:nombreGrupo/:idSerie', (req, res) => {
  const { nombreGrupo, idSerie } = req.params;

  // Primero, obtener todos los miembros del grupo
  const obtenerMiembrosGrupoSql = `SELECT U.id, U.Nombre FROM Usuarios U JOIN Usuario_Grupo2 UG ON U.id = UG.ID_Usuario WHERE UG.ID_Grupo = (SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?)`;
  db.query(obtenerMiembrosGrupoSql, [nombreGrupo], (err, miembros) => {
    if (err) {
      console.error('Error al obtener los miembros del grupo:', err);
      return res.status(500).send('Error al obtener los miembros del grupo');
    }

    // Llamada a la función para obtener los usuarios viendo la serie
    obtenerUsuariosViendoSerie(miembros, nombreGrupo, idSerie, res);
  });
});

function obtenerUsuariosViendoSerie(miembros, nombreGrupo, idSerie, res) {
  const sql = `
    SELECT 
    U.id,
    U.Nombre,
    COALESCE(T.Temporada_Mas_Alta, 0) AS Temporada_Mas_Alta,
    COALESCE(MAX(C.Numero_Capitulo), 0) AS Capitulo_Mas_Reciente
    FROM Usuarios U
    LEFT JOIN Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
    LEFT JOIN Visualizaciones V ON U.id = V.ID_Usuario
    LEFT JOIN Capitulo C ON V.ID_Capitulo = C.ID_Capitulo
    LEFT JOIN (
        -- Subconsulta para obtener la temporada más alta de cada usuario
        SELECT 
            U.id AS ID_Usuario, 
            MAX(C.Numero_Temporada) AS Temporada_Mas_Alta
        FROM Usuarios U
        INNER JOIN Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
        INNER JOIN Visualizaciones V ON U.id = V.ID_Usuario
        INNER JOIN Capitulo C ON V.ID_Capitulo = C.ID_Capitulo
        WHERE UG.ID_Grupo = (SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?)
          AND C.ID_Serie = ?
        GROUP BY U.id
    ) T ON U.id = T.ID_Usuario AND C.Numero_Temporada = T.Temporada_Mas_Alta
    WHERE UG.ID_Grupo = (SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?)
      AND C.ID_Serie = ?
    GROUP BY U.id, U.Nombre, T.Temporada_Mas_Alta
    ORDER BY T.Temporada_Mas_Alta DESC, Capitulo_Mas_Reciente DESC;
  `;

  db.query(sql, [nombreGrupo, idSerie, nombreGrupo, idSerie], (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      // Asegurarse de que todos los miembros del grupo estén incluidos, incluso si no tienen visualizaciones
      const resultadosCompletos = miembros.map(miembro => {
        const encontrado = results.find(resultado => resultado.id === miembro.id);
        if (encontrado) {
          return encontrado;
        } else {
          return {
            id: miembro.id,
            Nombre: miembro.Nombre,
            Temporada_Mas_Alta: 0,
            Capitulo_Mas_Reciente: 0
          };
        }
      }).sort((a, b) => {
        if (a.Temporada_Mas_Alta === b.Temporada_Mas_Alta) {
          return b.Capitulo_Mas_Reciente - a.Capitulo_Mas_Reciente;
        } else {
          return b.Temporada_Mas_Alta - a.Temporada_Mas_Alta;
        }
      });

      console.log(resultadosCompletos);
      res.json(resultadosCompletos);
    }
  });
}


const insertarGrupoConIdUnico = (nombreGrupo, admin, res, callback) => {
  let idGrupo = Math.floor(Math.random() * 1000000);

  const verificarYCrearGrupo = () => {
    // Verificar si el ID_Grupo ya existe
    db.query('SELECT * FROM Grupos WHERE ID_Grupo = ?', [idGrupo], (err, results) => {
      if (err) {
        console.error('Error al verificar el ID del grupo:', err);
        return res.status(500).send('Error al verificar el ID del grupo');
      }

      if (results.length > 0) {
        // El ID del grupo ya existe, genera uno nuevo y reintenta
        idGrupo = Math.floor(Math.random() * 1000000);
        verificarYCrearGrupo();
      } else {
        // El ID del grupo no existe, crea el grupo
        db.query('INSERT INTO Grupos (ID_Grupo, Nombre_grupo, Admin) VALUES (?, ?, ?)', [idGrupo, nombreGrupo, admin], (crearErr, crearResult) => {
          if (crearErr) {
            console.error('Error al crear el grupo:', crearErr);
            return res.status(500).send('Error al crear el grupo');
          }
          console.log('Grupo creado con ID:', idGrupo);
          if (callback) callback(idGrupo); // Continúa con la asociación de usuarios
        });
      }
    });
  };

  verificarYCrearGrupo();
};

// Ajusta la llamada inicial para incluir admin
app.post('/crear-grupo-y-asociar-usuarios', (req, res) => {
  const { nombreGrupo, nombresUsuarios, admin } = req.body;
  insertarGrupoConIdUnico(nombreGrupo, admin, res, (idGrupoNuevo) => {
    asociarUsuariosAGrupo(nombresUsuarios, idGrupoNuevo, res);
  });
});

function asociarUsuariosAGrupo(nombresUsuarios, idGrupo, res) {
  // Mapear cada nombre de usuario a una promesa que realiza la verificación y posible asociación
  const asociacionesPromesas = nombresUsuarios.map(nombreUsuario => {
    return new Promise(async (resolve, reject) => {
      try {
        const usuarioResults = await new Promise((resolve, reject) => {
          db.query('SELECT * FROM Usuarios WHERE Usuario = ?', [nombreUsuario], (err, results) => {
            if (err) reject(err);
            resolve(results);
          });
        });

        if (usuarioResults.length > 0) {
          const idUsuario = usuarioResults[0].Id;

          // Verificar si el usuario ya está asociado con el grupo
          const asociaciones = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM Usuario_Grupo2 WHERE ID_Usuario = ? AND ID_Grupo = ?', [idUsuario, idGrupo], (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });

          if (asociaciones.length === 0) {
            // Asociar el usuario al grupo
            await new Promise((resolve, reject) => {
              db.query('INSERT INTO Usuario_Grupo2 (ID_Usuario, ID_Grupo) VALUES (?, ?)', [idUsuario, idGrupo], (err, results) => {
                if (err) reject(err);
                resolve();
              });
            });
            console.log(`Usuario ${nombreUsuario} (ID: ${idUsuario}) asociado al grupo ID: ${idGrupo}.`);
            resolve(`Usuario ${nombreUsuario} asociado al grupo ID: ${idGrupo}.`);
          } else {
            resolve(`Usuario ${nombreUsuario} ya estaba asociado al grupo ID: ${idGrupo}.`);
          }
        } else {
          console.log(`Usuario ${nombreUsuario} no existe.`);
          resolve(`Usuario ${nombreUsuario} no existe.`);
        }
      } catch (error) {
        reject(`Error al asociar el usuario ${nombreUsuario} al grupo ID: ${idGrupo}: ${error}`);
      }
    });
  });

  // Esperar a que todas las promesas se resuelvan
  Promise.all(asociacionesPromesas).then(resultados => {
    console.log("Todos los usuarios han sido procesados:", resultados);
    res.send({ message: 'Todos los usuarios han sido procesados con éxito.', detalles: resultados });
  }).catch(error => {
    console.error("Error procesando los usuarios:", error);
    res.status(500).send('Error al asociar usuarios al grupo.');
  });
}


app.get('/miembros-grupo/:nombreGrupo', (req, res) => {
  const { nombreGrupo } = req.params;

  // Primero, obtén el ID del grupo basado en el nombre proporcionado
  const sqlGetGroupId = 'SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?';

  db.query(sqlGetGroupId, [nombreGrupo], (err, groupResults) => {
    if (err) {
      console.error('Error al buscar el grupo:', err);
      return res.status(500).send('Error al buscar el grupo en el servidor');
    }

    if (groupResults.length === 0) {
      return res.status(404).send('Grupo no encontrado');
    }

    const groupId = groupResults[0].ID_Grupo;

    // Luego, obtén los miembros del grupo usando el ID del grupo
    const sqlGetGroupMembers = `
      SELECT id, Usuarios.Nombre, Usuarios.Usuario, Usuarios.Apellidos
      FROM Usuarios
      JOIN Usuario_Grupo2 ON id = Usuario_Grupo2.ID_Usuario
      WHERE Usuario_Grupo2.ID_Grupo = ?
    `;

    db.query(sqlGetGroupMembers, [groupId], (err, membersResults) => {
      if (err) {
        console.error('Error al obtener los miembros del grupo:', err);
        return res.status(500).send('Error al obtener los miembros del grupo');
      }

      res.json({
        groupId: groupId,
        members: membersResults
      });
    });
  });
});


app.get('/miembros-grupo-POR-ID/:idGrupo', (req, res) => {
  const { idGrupo } = req.params;

  // Primero, obtén el ID del grupo basado en el nombre proporcionado
  const sqlGetGroupName = 'SELECT Nombre_grupo FROM Grupos WHERE ID_Grupo = ?';

  db.query(sqlGetGroupName, [idGrupo], (err, groupResults) => {
    if (err) {
      console.error('Error al buscar el grupo:', err);
      return res.status(500).send('Error al buscar el grupo en el servidor');
    }

    if (groupResults.length === 0) {
      return res.status(404).send('Grupo no encontrado');
    }

    const groupName = groupResults[0].Nombre_grupo;

    // Luego, obtén los miembros del grupo usando el ID del grupo
    const sqlGetGroupMembers = `
      SELECT id, Usuarios.Nombre, Usuarios.Usuario, Usuarios.Apellidos
      FROM Usuarios
      JOIN Usuario_Grupo2 ON id = Usuario_Grupo2.ID_Usuario
      WHERE Usuario_Grupo2.ID_Grupo = ?
    `;

    db.query(sqlGetGroupMembers, [idGrupo], (err, membersResults) => {
      if (err) {
        console.error('Error al obtener los miembros del grupo:', err);
        return res.status(500).send('Error al obtener los miembros del grupo');
      }

      res.json({
        nombreGrupo: groupName,
        members: membersResults
      });
    });
  });
});





app.get('/id-admin/:idGrupo', (req, res) => {

  const { idGrupo } = req.params;

  console.log('Id del grupo que busca Admin: ' + idGrupo)
    // Luego, obtén los miembros del grupo usando el ID del grupo
    const sqlGetAdmin = `
      SELECT Admin
      FROM Grupos
      WHERE ID_Grupo = ?
    `;

    db.query(sqlGetAdmin, [idGrupo], (err, adminResult) => {
      if (err) {
        console.error('Error al obtener el admin del grupo:', err);
        return res.status(500).send('Error al obtener el admin del grupo');
      }

      res.json({
        admin: adminResult
      });
    });

});

app.get('/usuario_por_id/:idUsuario', (req, res) => {
  console.log(req.params)
  usuario  = req.params.idUsuario;
  console.log('Usuario a añadir: ' , usuario)

  
  db.query('SELECT Id FROM Usuarios WHERE Usuario = ?', [usuario], (err, resultados) => {
    if (err) {
      console.error('Error al obtener el ID del usuario:', err);
      return res.status(500).send('Error al obtener el ID del usuario');
    }

    // Verifica si se encontraron resultados
    if (resultados.length > 0) {
      // Como esperamos un único resultado, tomamos el primer elemento
      const idUsuario = resultados[0].Id;

      res.json({
        idUsuario: idUsuario,
      });
    } else {
      // Maneja el caso en que no se encuentran resultados
      res.status(404).send('Usuario no encontrado');
    }
  });
});


app.get('/grupo_por_nombre/:nombreGrupo', (req, res) => {
  console.log(req.params);
  const nombreGrupo = req.params.nombreGrupo;
  console.log('Grupo a buscar: ', nombreGrupo);

  db.query('SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?', [nombreGrupo], (err, resultados) => {
    if (err) {
      console.error('Error al obtener el ID del grupo:', err);
      return res.status(500).send('Error al obtener el ID del grupo');
    }

    // Verifica si se encontraron resultados
    if (resultados.length > 0) {
      // Como esperamos un único resultado, tomamos el primer elemento
      const idGrupo = resultados[0].ID_Grupo;

      res.json({
        idGrupo: idGrupo,
      });
    } else {
      // Maneja el caso en que no se encuentran resultados
      res.status(404).send('Grupo no encontrado');
    }
  });
});



app.get('/comentarios_por_grupo_serie/:grupo_id/:serie_id', (req, res) => {
  const grupoId = req.params.grupo_id;
  const serieId = req.params.serie_id;

  if (!grupoId || !serieId) {
    return res.status(400).send('Faltan parámetros necesarios: grupo_id y serie_id');
        }

  const consultaSQL = `
    SELECT 
      Usuarios.Nombre, 
      ComentariosSerie.usuario_id,
      Usuarios.Apellidos, 
      ComentariosSerie.comentario, 
      ComentariosSerie.fecha_hora
    FROM 
      ComentariosSerie
    JOIN 
      Usuarios ON ComentariosSerie.usuario_id = Usuarios.Id
    WHERE 
      ComentariosSerie.grupo_id = ? AND ComentariosSerie.serie_id = ?
    ORDER BY 
      ComentariosSerie.fecha_hora ASC
  `;

  db.query(consultaSQL, [grupoId, serieId], (error, resultados) => {
    if (error) {
      console.error('Error al obtener los comentarios:', error);
      return res.status(500).send('Error al obtener los comentarios');
      }

    // Convierte los resultados en un formato más amigable si es necesario
    const comentarios = resultados.map(comentario => ({
      idUsuario: comentario.usuario_id,
      nombreCompleto: `${comentario.Nombre} ${comentario.Apellidos}`,
      comentario: comentario.comentario,
      fechaHora: comentario.fecha_hora,
    }));

    console.log('COMENTARIOS' , comentarios)

    res.json(comentarios);
  });
});




app.post('/anadir_comentario_a_serie', (req, res) => {
// Recibir los datos necesarios del cuerpo de la solicitud
const idUsuario = req.body.idUsuario;
const idGrupo = req.body.idGrupo;
const idSerie = req.body.idSerie;
const comentario = req.body.comentario;

console.log("Id usuario: ", idUsuario);
console.log("Id grupo: ", idGrupo);
console.log("Id serie: ", idSerie);
console.log("Comentario: ", comentario);

// Insertar el comentario en la base de datos
db.query('INSERT INTO ComentariosSerie (comentario, usuario_id, grupo_id, serie_id) VALUES (?, ?, ?, ?)', [comentario, idUsuario, idGrupo, idSerie], (errorInsert, resultsInsert) => {
  if (errorInsert) {
    // Manejar errores de base de datos aquí
    console.log("Error BBDD: ", errorInsert);
    res.json({ success: 0, mensaje: 'Error del servidor al insertar el comentario' });
  } else {
    let mensaje = 'Comentario añadido con éxito';
    console.log(mensaje);
    res.json({ success: 1, mensaje: mensaje, idComentario: resultsInsert.insertId }); // Devuelve el ID del comentario insertado
}
});
});
                    
                    

app.post('/anadir_usuario_a_grupo', (req, res) => {
  const idUsuario = req.body.idUsuario; // Acceso correcto al cuerpo de la solicitud
  const idGrupo = req.body.idGrupo; // Acceso correcto al cuerpo de la solicitud
  console.log("Id usuario: ", idUsuario);
  console.log("Id grupo: ", idGrupo);

  // Primero, verificar si la combinación ya existe en la base de datos
  db.query('SELECT * FROM Usuario_Grupo2 WHERE ID_Usuario = ? AND ID_Grupo = ?', [idUsuario, idGrupo], (error, results) => {
    if (error) {
      // Manejar errores de base de datos aquí
      console.log("Error BBDD");
      res.json({ success: 0, mensaje: 'Error del servidor al verificar la existencia' });
    } else if (results.length > 0) {
      // Si ya existe, enviar una respuesta indicando que ya se encuentra en el grupo
      console.log("El usuario ya está añadido al grupo");
      res.json({ success: 2, mensaje: 'El usuario ya existe en el grupo' });
    } else {
      // Si no existe, proceder con la inserción
      db.query('INSERT INTO Usuario_Grupo2 (ID_Usuario, ID_Grupo) VALUES (?, ?)', [idUsuario, idGrupo], (errorInsert, resultsInsert) => {
        if (errorInsert) {
          // Manejar errores de base de datos aquí
          console.log("Error BBDD");
          res.json({ success: 0, mensaje: 'Error del servidor al insertar'});
        } else {
          let mensaje = 'Añadido con éxito';
          console.log(mensaje);
          res.json({ success: 1, mensaje: mensaje });
        }
      });
    }
  });
});


app.post('/anadir_comentario_a_serie', async (req, res) => {
  const { idUsuario, idGrupo, idSerie, comentario, respuestaA } = req.body;

  try {
    const nuevoComentario = await db.query(
      'INSERT INTO ComentariosSerie (usuario_id, grupo_id, serie_id, comentario, respuestaA) VALUES (?, ?, ?, ?, ?)',
      [idUsuario, idGrupo, idSerie, comentario, respuestaA || null]
    );

    res.json({ mensaje: 'Comentario añadido con éxito', comentario: nuevoComentario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al añadir el comentario' });
  }
});






app.put('/actualizar-nombre-grupo/:id', (req, res) => {
  const { id } = req.params; // Obtén el ID del grupo de los parámetros de la ruta
  const { nuevoNombre } = req.body; // Asume que el nuevo nombre viene en el cuerpo de la solicitud

  console.log('Entramos en actualizar nombre del grupo')

  if (!nuevoNombre) {
    return res.status(400).send('El nuevo nombre es requerido');
  }

  // Consulta SQL para actualizar el nombre del grupo en la base de datos
  const sqlUpdateGroupName = `
    UPDATE Grupos
    SET Nombre_grupo = ?
    WHERE ID_Grupo = ?
  `;

  db.query(sqlUpdateGroupName, [nuevoNombre, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el nombre del grupo:', err);
      return res.status(500).send('Error al actualizar el nombre del grupo');
    }

    if (result.affectedRows === 0) {
      // Si no se encontró el grupo con ese ID o no se realizó la actualización
      return res.status(404).send('Grupo no encontrado o no se pudo actualizar');
    }

    console.log(`Grupo con ID ${id} actualizado a nombre "${nuevoNombre}"`);
    res.send(`Grupo con ID ${id} ha sido actualizado exitosamente a "${nuevoNombre}"`);
  });
});

app.delete('/eliminar-grupo/:groupId', (req, res) => {
  const { groupId } = req.params;

  const sql = 'DELETE FROM Grupos WHERE ID_Grupo = ?';

  db.query(sql, [groupId], (err, result) => {
    if (err) {
      console.error('Error al eliminar el grupo:', err);
      return res.status(500).send('Error al eliminar el grupo');
    }

    if (result.affectedRows > 0) {
      res.send('Grupo eliminado correctamente.');
    } else {
      res.status(404).send('Grupo no encontrado.');
    }
  });
});


app.delete('/eliminar-usuario_grupo/:groupId/:userId', (req, res) => {
  console.log('REQ ' + req.params)
  const { groupId , userId } = req.params;
  console.log('Grupo e ID Usuario: ' + groupId + ' ' + userId)

  const sql = 'DELETE FROM Usuario_Grupo2 WHERE ID_Grupo = ? AND ID_Usuario = ?';

  db.query(sql, [groupId, userId], (err, result) => {
    if (err) {
      console.error('Error al eliminar usuariio y grupo:', err);
      return res.status(500).send('Error al eliminar el grupo');
    }

    if (result.affectedRows > 0) {
      res.send('Usuario ya no pertenece al grupo');
    } else {
      res.status(404).send('Grupo no encontrado.');
    }
  });
});


app.delete('/eliminar-cuenta/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = 'DELETE FROM Usuarios WHERE Id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error al eliminar la cuenta:', err);
      return res.status(500).send('Error al eliminar la cuenta');
    }

    if (result.affectedRows > 0) {
      res.send('Cuenta eliminada correctamente.');
    } else {
      res.status(404).send('Cuenta no encontrada.');
    }
  });
});


app.post('/enviar-soporte', (req, res) => {
  const { nombre, email, mensaje } = req.body;
  

  let transporter = nodemailer.createTransport({
      service: 'gmail', // Ejemplo con Gmail; ajusta según tu proveedor
      auth: {
          user: 'diego.vinalslage@gmail.com', // Tu dirección de correo
          pass: 'jdlh mfat iezv vcgp', // Tu contraseña o token de app
      }
  });

  let mailOptions = {
      from: `FAMILY SERIES TRACK`, // Remitente (opcional)
      to: 'diego.vinalslage@gmail.com', // Dirección a la que enviarás el email
      subject: `Nueva solicitud de soporte de ${nombre}`, // Asunto
      text: `Nombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`, // Cuerpo del mensaje
      // Si quieres enviar HTML: html: '<b>Hola mundo</b>'
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
          res.status(500).send('Error al enviar el mensaje');
      }
      console.log('Mensaje enviado: %s', info.messageId);
      res.send('Mensaje enviado con éxito');
  });
});




app.get('/capitulos-vistos/:idUsuario', (req, res) => {
  const usuarioId = req.params.idUsuario;

  console.log("Usuario Id: ", usuarioId);
  if (!usuarioId) {
    return res.status(400).send('Faltan parámetros necesarios: usuario_id');
  }

  const consultaSQL = `
    SELECT 
      Series.ID_Serie,
      COUNT(DISTINCT Visualizaciones.ID_Capitulo) AS capitulosVistos
    FROM 
      Series
    JOIN 
      Capitulo ON Series.ID_Serie = Capitulo.ID_Serie
    JOIN 
      Visualizaciones ON Visualizaciones.ID_Capitulo = Capitulo.ID_Capitulo
    WHERE 
      Visualizaciones.ID_Usuario = ?
    GROUP BY 
      Series.ID_Serie
    ORDER BY 
      capitulosVistos DESC
  `;

  db.query(consultaSQL, [usuarioId], (error, resultados) => {
    if (error) {
      console.error('Error al obtener los capítulos vistos:', error);
      return res.status(500).send('Error al obtener los capítulos vistos');
    }

    // Convierte los resultados en un formato más amigable si es necesario
    const capitulosVistos = resultados.map(serie => ({
      serie: serie.ID_Serie,
      capitulosVistos: serie.capitulosVistos,
    }));

    console.log('Capítulos Vistos:', capitulosVistos);

    res.json(capitulosVistos);
  });
});



// Ejemplo de endpoint para temporadas en total
app.get('/temporadas-vistas/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  // Consulta a la base de datos para obtener las temporadas vistas
  const totalTemporadasVistas = { totalTemporadasVistas: 10 };

  res.json(totalTemporadasVistas);
});

// Ejemplo de endpoint para series vistas
app.get('/series-vistas/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  // Consulta a la base de datos para obtener las series vistas
  const seriesVistas = [
    { serie: 'Breaking Bad', temporadasVistas: 5 },
    { serie: 'Stranger Things', temporadasVistas: 3 }
  ];

  res.json(seriesVistas);
});

// NOTIFICACIONES
app.post('/registrar-token-notificacion', (req, res) => {
  console.log('Iniciando registro de token de notificación');
  const { userId, token } = req.body;
  console.log(`Datos recibidos - userId: ${userId}, token: ${token}`);

  // Primero, comprobar si el token ya existe para el usuario
  console.log('Comprobando si el token ya existe para el usuario');
  db.query('SELECT * FROM TokensNotificaciones WHERE Usuario_Id = ? AND token = ?', [userId, token], (err, results) => {
    if (err) {
      console.error('Error al comprobar el token de notificación:', err);
      return res.status(500).send('Error al comprobar el token de notificación');
    }

    if (results.length > 0) {
      // Si el token ya existe, enviar un mensaje indicando que ya existe
      console.log('El token de notificación ya existe para este usuario');
      res.send('El token de notificación ya existe para este usuario');
    } else {
      // Si el token no existe, insertarlo en la base de datos
      console.log('El token no existe, insertándolo en la base de datos');
      db.query('INSERT INTO TokensNotificaciones (Usuario_Id, token) VALUES (?, ?)', [userId, token], (err, result) => {
        if (err) {
          console.error('Error al registrar el token de notificación:', err);
          return res.status(500).send('Error al registrar el token de notificación');
        }
        console.log('Token de notificación registrado correctamente');
        res.send('Token de notificación registrado correctamente');
      });
    }
  });
});


// obetner token de notificacion push
app.get('/obtener-token/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;
  console.log('ID del usuario:', idUsuario);

  // Supongamos que tienes una función para obtener los tokens del usuario
  db.query('SELECT token FROM TokensNotificaciones WHERE Usuario_Id = ?', [idUsuario], (err, results) => {
    if (err) {
      console.error('Error al obtener los tokens del usuario:', err);
      return res.status(500).send('Error al obtener los tokens del usuario');
    }

    if (results.length > 0) {
      const tokens = results.map(result => result.token);
      res.json({ tokens });
    } else {
      res.status(404).send('Tokens no encontrados');
    }
  });
});

// Eliminar token de notificación push específico
app.delete('/eliminar-token', (req, res) => {
  const { token } = req.body;
  console.log('Eliminando token:', token);

  db.query('DELETE FROM TokensNotificaciones WHERE token = ?', [token], (err, result) => {
    if (err) {
      console.error('Error al eliminar el token:', err);
      return res.status(500).send('Error al eliminar el token');
    }

    if (result.affectedRows > 0) {
      console.log(`Se eliminó el token ${token}`);
      res.send(`Token eliminado correctamente`);
    } else {
      console.log(`No se encontró el token ${token} para eliminar`);
      res.status(404).send('No se encontró el token para eliminar');
    }
  });
});


// Endpoint para solicitar la recuperación de contraseña
app.post('/solicitar-recuperacion-contrasena', (req, res) => {
  const { email, usuarioParams } = req.body;
  console.log('Entramos en solicitar recuperación de contraseña');
  console.log('Email: ', email);
  console.log('Usuario: ', usuarioParams);

  // Verificar si el usuario existe
  db.query('SELECT * FROM Usuarios WHERE Usuario = ?', [usuarioParams], (err, results) => {
    if (err) {
      console.error('Error al buscar el usuario:', err);
      return res.status(500).send('Error al buscar el usuario');
    }

    if (results.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    const usuario = results[0];
    const token = crypto.randomBytes(20).toString('hex');
    const expiracion = Date.now() + 3600000; // 1 hora

    // Almacenar el token y la fecha de expiración en la base de datos
    db.query('INSERT INTO tokenContrasena (resetPasswordToken, resetPasswordExpires, Email, nombreUsuario) VALUES (?, ?, ?, ?)', [token, expiracion, email, usuarioParams], (err) => {
      if (err) {
        console.error('Error al almacenar el token:', err);
        return res.status(500).send('Error al almacenar el token');
      }

      let transporter = nodemailer.createTransport({
        service: 'gmail', // Ejemplo con Gmail; ajusta según tu proveedor
        auth: {
            user: 'diego.vinalslage@gmail.com', // Tu dirección de correo
            pass: 'jdlh mfat iezv vcgp', // Tu contraseña o token de app
        }
    });
  
    let mailOptions = {
        from: `"FAMILY SERIES TRACK" <diego.vinalslage@gmail.com>`,
        to: email,
        subject: 'Recuperación de contraseña',
        text: `Recibiste este correo porque solicitaste la recuperación de la contraseña de tu cuenta.\n\n` +
              `Por favor, usa el siguiente token para recuperar tu contraseña:\n\n` +
              `${token}\n\n` +
              `Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.\n`
      };

      // Enviar el correo electrónico
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error al enviar el correo:', error);
          return res.status(500).send('Error al enviar el correo');
        }
        res.json({ success: 1 });
      });
    });
  });
});

// Endpoint para verificar el token y cambiar la contraseña
app.post('/recuperar-contrasena', (req, res) => {
  const { token, nuevaContrasena } = req.body;

  console.log('Entramos en recuperar contraseña');
  console.log('Token: ', token);
  console.log('Nueva contraseña: ', nuevaContrasena);
  // Verificar si el token es válido y no ha expirado
  db.query('SELECT * FROM tokenContrasena WHERE resetPasswordToken = ? AND resetPasswordExpires > ?', [token, Date.now()], (err, results) => {
    if (err) {
      console.error('Error al buscar el token:', err);
      return res.status(500).send('Error al buscar el token');
    }

    if (results.length === 0) {
      return res.status(400).send('Token inválido o expirado');
    }

    const usuarioNombre = results[0].nombreUsuario;

    // Actualizar la contraseña del usuario
    db.query('UPDATE Usuarios SET Contraseña = ? WHERE Usuario = ?', [nuevaContrasena, usuarioNombre], (err) => {
        if (err) {
          console.error('Error al actualizar la contraseña:', err);
          return res.status(500).send('Error al actualizar la contraseña');
        }
        res.json({ success: 1 });
    });
  });
});


app.post('/anadir-favorito', (req, res) => {
  const { idUsuario, idSerie } = req.body;

  if (!idUsuario || !idSerie) {
    return res.status(400).send('ID de Usuario y ID de Serie son requeridos');
  }

  const sqlInsertFavorito = 'INSERT INTO Favoritos (ID_Usuario, ID_Serie) VALUES (?, ?)';

  db.query(sqlInsertFavorito, [idUsuario, idSerie], (err, result) => {
    if (err) {
      console.error('Error al insertar en la tabla Favoritos:', err);
      return res.status(500).send('Error al insertar en la tabla Favoritos');
    }

    console.log('Favorito añadido con éxito:', result);
    res.json({ message: 'Favorito añadido con éxito', insertId: result.insertId });
  });
});


app.get('/existe-favorito/:idUsuario/:idSerie', (req, res) => {
  const { idUsuario, idSerie } = req.params;

  if (!idUsuario || !idSerie) {
    return res.status(400).send('ID de Usuario y ID de Serie son requeridos');
  }

  const sqlCheckFavorito = 'SELECT * FROM Favoritos WHERE ID_Usuario = ? AND ID_Serie = ?';

  db.query(sqlCheckFavorito, [idUsuario, idSerie], (err, results) => {
    if (err) {
      console.error('Error al verificar en la tabla Favoritos:', err);
      return res.status(500).send('Error al verificar en la tabla Favoritos');
    }

    if (results.length > 0) {
      res.json({ exists: true, message: 'El favorito existe' });
    } else {
      res.json({ exists: false, message: 'El favorito no existe' });
    }
  });
});


app.get('/series-favoritas/:idUsuario', (req, res) => {
  const { idUsuario } = req.params;

  if (!idUsuario) {
    return res.status(400).send('ID de Usuario es requerido');
  }

  const sqlGetSeriesFavoritas = 'SELECT ID_Serie FROM Favoritos WHERE ID_Usuario = ?';

  db.query(sqlGetSeriesFavoritas, [idUsuario], (err, results) => {
    if (err) {
      console.error('Error al obtener las series favoritas:', err);
      return res.status(500).send('Error al obtener las series favoritas');
    }

    const seriesIds = results.map(row => row.ID_Serie);
    res.json({ seriesIds });
  });
});


app.delete('/eliminar-favorito', (req, res) => {
  const { idUsuario, idSerie } = req.body;

  if (!idUsuario || !idSerie) {
    return res.status(400).send('ID de Usuario y ID de Serie son requeridos');
  }

  const sqlDeleteFavorito = 'DELETE FROM Favoritos WHERE ID_Usuario = ? AND ID_Serie = ?';

  db.query(sqlDeleteFavorito, [idUsuario, idSerie], (err, result) => {
    if (err) {
      console.error('Error al eliminar de la tabla Favoritos:', err);
      return res.status(500).send('Error al eliminar de la tabla Favoritos');
    }

    if (result.affectedRows > 0) {
      console.log('Favorito eliminado con éxito:', result);
      res.json({ message: 'Favorito eliminado con éxito' });
    } else {
      res.status(404).send('Favorito no encontrado');
    }
  });
});
app.get('/visualizaciones-grupo-serie/:idGrupo/:idSerie', (req, res) => {
  console.log('Recibida petición GET /visualizaciones-grupo-serie');
  const { idGrupo, idSerie } = req.params;
  console.log('Parámetros recibidos:', { idGrupo, idSerie });

  if (!idGrupo || !idSerie) {
    console.log('Error: Faltan parámetros requeridos');
    return res.status(400).json({ error: 'Se requieren ID de grupo y serie' });
  }

  const sql = `
    SELECT 
      u.Nombre,
      u.Apellidos, 
      c.Numero_Temporada,
      c.Numero_Capitulo,
      v.Fecha_Visualizacion
    FROM Visualizaciones v
    INNER JOIN Usuarios u ON v.ID_Usuario = u.Id
    INNER JOIN Usuario_Grupo2 ug ON u.Id = ug.ID_Usuario
    INNER JOIN Capitulo c ON v.ID_Capitulo = c.ID_Capitulo
    WHERE ug.ID_Grupo = ? 
    AND c.ID_Serie = ?
    ORDER BY v.Fecha_Visualizacion DESC
  `;
  console.log('Ejecutando consulta SQL:', sql);

  db.query(sql, [idGrupo, idSerie], (err, results) => {
    if (err) {
      console.error('Error al obtener visualizaciones:', err);
      return res.status(500).json({ error: 'Error al obtener visualizaciones' });
    }

    console.log('Resultados obtenidos:', results.length);
    const visualizaciones = results.map(row => ({
      nombreUsuario: `${row.Nombre} ${row.Apellidos}`,
      temporada: row.Numero_Temporada,
      capitulo: row.Numero_Capitulo, 
      fecha: row.Fecha_Visualizacion
    }));
    console.log('Visualizaciones procesadas:', visualizaciones);

    res.json(visualizaciones);
  });
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Escuchar en un puerto