const express = require('express');
const mysql = require('mysql');
const http2 = require('http2');
const bodyParser = require('body-parser');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');


const app = express();

app.use(express.json()); // Para analizar application/json
  console.log('Conectando...')
  // Crear conexión a la base de datos

  /** 
  const db = mysql.createConnection({
    host: '2.139.97.114', // La IP de tu máquina donde corre Docker
    user: 'root', // El usuario de la base de datos
    password: '27101998', // La contraseña de la base de datos
    database: 'Series' // El nombre de tu base de datos
  });
  */

  const db = mysql.createConnection({
    host: '192.168.1.113', // La IP de tu máquina donde corre Docker
    user: 'root', // El usuario de la base de datos
    password: '27101998', // La contraseña de la base de datos
    database: 'Series' // El nombre de tu base de datos
  });

  conectado = 0

  // Conectar a la base de datos
  db.connect((err) => {
    if(err) {
      console.log('----- ERROR -----')
      throw err;
    }
    conectado = 1
    const now = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    console.log(`Conectado a MariaDB - ${now.toLocaleDateString('es-ES', options)}`);

    
});

app.use(cors({
  origin: 'https://soportefst.lapspartbox.com' // Asegúrate de cambiar esto por tu origen específico
}));

app.get('/admin/health' , (req,res) => {
  res.send('Hello World')
})


// Método para verificar el inicio de sesión de un usuario
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

// Método para verificar el inicio de sesión de un usuario
app.post('/login', (req, res) => {
  let usuario = req.body.usuario;
  let contraseña = req.body.contraseña; // Asegúrate de que esto coincida con el nombre de campo en tu base de datos

  console.log("Usuario: " + usuario);
  console.log("Contraseña: " + contraseña);
  let sql = 'SELECT * FROM Usuarios WHERE Usuario = ? AND Contraseña = ?';
  db.query(sql, [usuario, contraseña], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al verificar el usuario');
    }
    if (results.length > 0) {
      // Usuario encontrado y contraseña correcta
      

      console.log('Inicio de sesión exitoso');
      // Envía los datos del usuario en la respuesta
      let user = results[0]; // asumiendo que el usuario es único
      console.log(user)
      res.json({ success: 1, user: user });
    } else {
      // Usuario no encontrado o contraseña incorrecta
      console.log('Usuario o contraseña incorrectos');
      res.json({ success: 0 });
    }
  });
});

// Ruta de prueba para obtener datos de la tabla Usuarios
app.get('/usuario', (req, res) => {
  console.log("llamado a Usuario")
  let sql = 'SELECT * FROM Usuarios';
  db.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
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


// Ruta para añadir un nuevo usuario a la tabla Usuarios
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



// Ruta de prueba para obtener datos de la tabla Usuario_grupo
app.get('/usuario_grupo', (req, res) => {
  console.log("llamado a Usuario_Grupo")
  let sql = 'SELECT * FROM Usuario_Grupo2';
  db.query(sql, (err, results) => {
    if(err) throw err;
    console.log(results);
    res.send(results);
  });
});

// Ruta para obtener los grupos a los que pertenece un usuario
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



/*
Esta función maneja una solicitud GET para obtener los IDs de las series de televisión 
que son comunes a todos los usuarios de un grupo específico. 
Recibe el ID de un usuario y el nombre de un grupo como parámetros, 
busca el ID del grupo en la base de datos, y luego consulta las series que todos 
los usuarios de ese grupo tienen en común.
*/
app.get('/series-ids-usuario/:userId', (req, res) => {
  // Extraemos el userId del parámetro de ruta y el groupName del parámetro de consulta
  const userId = req.params.userId;
  const groupName = req.query.value; // 'value' ahora representa el nombre del grupo

  // Si el nombre del grupo es "Grupos", devolvemos una respuesta JSON vacía
  if (groupName === "Grupos") {
    console.log("groupName es 'Grupos', enviando respuesta JSON vacía");
    res.json({});
    return;
  }

  // Registrando en consola el inicio del proceso
  console.log("Llamado para obtener los IDs de series para el usuario:", userId);
  console.log("Para el grupo con nombre:", groupName);

  // Consulta SQL para obtener el ID del grupo basándonos en el nombre del grupo
  let sqlGetGroupId = `SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?`;

  // Ejecución de la consulta para obtener el ID del grupo
  db.query(sqlGetGroupId, [groupName], (err, groupResults) => {
    if (err) {
      // En caso de error en la consulta, devolver un error 500
      console.error('Error al buscar el grupo:', err);
      res.status(500).send('Error al buscar el grupo en el servidor');
      return;
    }

    // Si no se encuentra el grupo (no hay resultados), devolver un error 404
    if (groupResults.length === 0) {
      res.status(404).send('Grupo no encontrado');
      return;
    }

    // Si se encuentra el grupo, extraemos su ID
    const groupId = groupResults[0].ID_Grupo;
    console.log("ID del grupo encontrado:", groupId);

    // Consulta SQL para obtener los IDs de usuarios que pertenecen al grupo encontrado
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
});





app.post('/agregar-serie-usuario', (req, res) => {
  const userId = req.body.userId;
  const idSerie = req.body.idSerie;

  console.log(`Solicitud para agregar la serie con ID ${idSerie} al usuario ${userId}`);

  // Primero, verifica si ya existe el par userId e idSerie
  let sqlCheck = `SELECT * FROM Series WHERE ID_Usuario = ? AND ID_Serie = ?`;

  db.query(sqlCheck, [userId, idSerie], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      res.status(500).send('Error en el servidor');
      return;
    }
    if (results.length > 0) {
      // Si ya existe la serie para el usuario, no hagas la inserción
      console.log(`La serie con ID ${idSerie} ya existe para el usuario ${userId}`);
      res.status(409).send(`La serie ya existe`);
    } else {
      // Si no existe, inserta la nueva serie para el usuario
      let sqlInsert = `INSERT INTO Series (ID_Usuario, ID_Serie) VALUES (?, ?)`;

      db.query(sqlInsert, [userId, idSerie], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error al insertar:', insertErr);
          res.status(500).send('Error al insertar en el servidor');
          return;
        }
        console.log(`Serie con ID ${idSerie} agregada al usuario ${userId}`);
        res.status(200).send(`Serie agregada exitosamente al usuario ${userId}`);
      });
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
  const fechaActual = new Date().toISOString().slice(0, 10);
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

  const sql = `
    SELECT 
      U.id,
      U.Nombre,
      MAX(C.Numero_Temporada) AS Temporada_Mas_Alta,
      MAX(C.Numero_Capitulo) AS Capitulo_Mas_Reciente
    FROM Usuarios U
    INNER JOIN Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
    INNER JOIN Visualizaciones V ON U.id = V.ID_Usuario
    INNER JOIN Capitulo C ON V.ID_Capitulo = C.ID_Capitulo
    WHERE UG.ID_Grupo = (SELECT ID_Grupo FROM Grupos WHERE Nombre_grupo = ?)
      AND C.ID_Serie = ?
    GROUP BY U.id
    ORDER BY Temporada_Mas_Alta DESC, Capitulo_Mas_Reciente DESC;
  `;

  db.query(sql, [nombreGrupo, idSerie], (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err);
      res.status(500).send('Error interno del servidor');
    } else {
      console.log(results);
      res.json(results);
    }
  });
});

app.post('/guardar-token', (req, res) => {
    const { userId, token } = req.body; // Usando req.body en lugar de req.params
    
    // Asegúrate de que tanto el userId como el token estén presentes
    if (!userId || !token) {
      return res.status(400).send('Se requieren el userId y el token.');
    }

    // Verifica si el token ya existe para el usuario
    const verificarSql = `SELECT * FROM PushToken WHERE userId = ? AND token = ?`;
    db.query(verificarSql, [userId, token], (err, results) => {
      if (err) {
        console.error('Error al verificar el token:', err);
        return res.status(500).send('Error interno del servidor');
      }

      // Si el token ya existe, no hacer nada
      if (results.length > 0) {
        return res.send('El token ya existe, no se realizaron cambios.');
      }

      // Si el token no existe, insertarlo
      const insertarSql = `INSERT INTO PushToken (userId, token) VALUES (?, ?);`;
      db.query(insertarSql, [userId, token], (err, results) => {
        if (err) {
          console.error('Error al insertar el token:', err);
          return res.status(500).send('Error interno del servidor');
        }
        console.log('Token guardado con éxito:', results);
        res.send('Token guardado con éxito');
      });
    });
});

// Endpoint para obtener los tokens de notificación de todos los usuarios en un grupo específico
app.get('/getNotificationTokens/:groupName', (req, res) => {
    const groupName = req.params.groupName;
  
    const sql = `
      SELECT PT.token
      FROM PushToken PT
      INNER JOIN Usuarios U ON PT.userId = U.id
      INNER JOIN Usuario_Grupo2 UG ON U.id = UG.ID_Usuario
      INNER JOIN Grupos G ON UG.ID_Grupo = G.ID_Grupo
      WHERE G.Nombre_grupo = ?
    `;
  
    db.query(sql, [groupName], (error, results) => {
      if (error) {
        console.error('Error al obtener los tokens de notificación: ', error);
        return res.status(500).send('Error al obtener los tokens de notificación');
      }
  
      // Devuelve los tokens de notificación
      res.json(results.map(row => row.token));
    });
  });
  



app.post('/crear-grupo-y-asociar-usuarios', (req, res) => {
  const { nombreGrupo, nombresUsuarios } = req.body;

  // Verificar si el nombre del grupo ya existe
  db.query('SELECT * FROM Grupos WHERE Nombre_grupo = ?', [nombreGrupo], (err, grupoResults) => {
    if (err) {
      console.error('Error al verificar el grupo:', err);
      return res.status(500).send('Error al verificar el grupo');
    }

    if (grupoResults.length > 0) {
      // El grupo ya existe
      const idGrupo = grupoResults[0].ID_Grupo;
      console.log('El grupo ya existe con ID:', idGrupo);
      res.send({ message: 'El grupo ya existe' });
      //asociarUsuariosAGrupo(nombresUsuarios, idGrupo, res);
    } else {
      // El grupo no existe, intenta crear uno nuevo con un ID único
      insertarGrupoConIdUnico(nombreGrupo, res, (idGrupoNuevo) => {
      asociarUsuariosAGrupo(nombresUsuarios, idGrupoNuevo, res);
      });
    }
  });
});

// Función para insertar un grupo con un ID único
const insertarGrupoConIdUnico = (nombreGrupo, res, callback) => {
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
        idGrupo =  Math.floor(Math.random() * 1000000);
        verificarYCrearGrupo();
      } else {
        // El ID del grupo no existe, crea el grupo
        db.query('INSERT INTO Grupos (ID_Grupo, Nombre_grupo) VALUES (?, ?)', [idGrupo, nombreGrupo], (crearErr, crearResult) => {
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



// modifca el nombre de un grupo
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


// PARA NOTIFICACIONES
const jwt2 = require("jsonwebtoken");
const authorizationToken = jwt2.sign(
  {
    iss: "com.edgehealth.seriesdv",
    iat: Math.round(new Date().getTime() / 1000),
  },
  fs.readFileSync("./AuthKey_AAJC7S5F5Q.p8", "utf8"),
  {
    header: {
      alg: "ES256",
      kid: "AAJC7S5F5Q",
    },
  }
);

console.log('TOKEN: ' + authorizationToken)

const IS_PRODUCTION = false;

app.post('/send-notification', (req, res) => {
  const { token, usuario, nombreSerie, numeroTemporada, numeroCapitulo } = req.body;

  const client = http2.connect(
    IS_PRODUCTION ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com'
  );
  
  client.on('connect', () => {
    console.log('La conexión se ha establecido con éxito.');
    const request = client.request({
      ':method': 'POST',
      ':scheme': 'https',
      'apns-topic': 'com.edgehealth.seriesdv',
      ':path': '/3/device/' + token, // token es el nativeDeviceToken del dispositivo
      'authorization': `bearer ${authorizationToken}`,
    });

    console.log('--------------- REQUEST ---------------')
    console.log(request)

    request.setEncoding('utf8');
    request.write(
      JSON.stringify({
        aps: {
          alert: {
            title: `${usuario}, nuevo episodio disponible!`,
            body: `Echa un vistazo al episodio ${numeroCapitulo} de la temporada ${numeroTemporada} de ${nombreSerie}.`,
          },
        },
        // Asegúrate de que estos campos sean manejados correctamente por el receptor
        experienceId: '@dvinals98/TestTFG',
        scopeKey: '@dvinals98/TestTFG'
      })
    );

    request.end();

    request.on('end', () => {
      client.close();
      res.status(200).send('Notificación enviada con éxito.');
    });
  });
  
  client.on('error', (err) => {
    console.error('Ocurrió un error al conectar:', err);
  });

  console.log("-------------------------- REQUEST NOTIFICATION --------------------------");
});


// Ruta que maneja el envío del formulario
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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Escuchar en un puerto