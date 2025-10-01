const express = require('express');
const { promisePool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener perfil del usuario
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await promisePool.execute(
      `SELECT id, nombre, email, pais, biografia, foto_perfil, 
              porcentaje_perfil, staff, created_at 
       FROM usuarios WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Obtener estadísticas
    const [stats] = await promisePool.execute(
      `SELECT 
        COUNT(*) as cursos_inscritos,
        SUM(CASE WHEN completado = TRUE THEN 1 ELSE 0 END) as cursos_completados,
        (SELECT COUNT(*) FROM diplomas WHERE usuario_id = ?) as diplomas_obtenidos
       FROM usuario_cursos WHERE usuario_id = ?`,
      [userId, userId]
    );

    // Obtener intereses
    const [interests] = await promisePool.execute(
      `SELECT ci.nombre as categoria, sci.nombre as subcategoria 
       FROM usuario_intereses ui
       JOIN subcategorias_interes sci ON ui.subcategoria_id = sci.id
       JOIN categorias_interes ci ON sci.categoria_id = ci.id
       WHERE ui.usuario_id = ?`,
      [userId]
    );

    // Obtener habilidades
    const [skills] = await promisePool.execute(
      `SELECT h.nombre 
       FROM usuario_habilidades uh
       JOIN habilidades h ON uh.habilidad_id = h.id
       WHERE uh.usuario_id = ?`,
      [userId]
    );

    // Obtener software
    const [software] = await promisePool.execute(
      `SELECT s.nombre 
       FROM usuario_software us
       JOIN software s ON us.software_id = s.id
       WHERE us.usuario_id = ?`,
      [userId]
    );

    res.json({
      user: {
        ...user,
        estadisticas: stats[0],
        intereses: interests,
        habilidades: skills.map(s => s.nombre),
        software: software.map(s => s.nombre)
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar perfil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, pais, biografia } = req.body;

    await promisePool.execute(
      'UPDATE usuarios SET nombre = ?, pais = ?, biografia = ? WHERE id = ?',
      [nombre, pais, biografia, userId]
    );

    // Recalcular porcentaje de perfil
    await actualizarPorcentajePerfil(userId);

    res.json({ message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar intereses
router.put('/interests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subcategorias } = req.body; // Array de subcategoria_ids

    // Eliminar intereses actuales
    await promisePool.execute(
      'DELETE FROM usuario_intereses WHERE usuario_id = ?',
      [userId]
    );

    // Insertar nuevos intereses
    if (subcategorias && subcategorias.length > 0) {
      const values = subcategorias.map(subcategoriaId => [userId, subcategoriaId]);
      await promisePool.query(
        'INSERT INTO usuario_intereses (usuario_id, subcategoria_id) VALUES ?',
        [values]
      );
    }

    // Recalcular porcentaje de perfil
    await actualizarPorcentajePerfil(userId);

    res.json({ message: 'Intereses actualizados exitosamente' });
  } catch (error) {
    console.error('Error actualizando intereses:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función para actualizar porcentaje de perfil
async function actualizarPorcentajePerfil(userId) {
  const [user] = await promisePool.execute(
    'SELECT nombre, pais, biografia FROM usuarios WHERE id = ?',
    [userId]
  );

  let porcentaje = 0;
  const userData = user[0];

  if (userData.nombre) porcentaje += 25;
  if (userData.pais) porcentaje += 25;
  if (userData.biografia) porcentaje += 25;

  // Verificar si tiene intereses
  const [interests] = await promisePool.execute(
    'SELECT COUNT(*) as count FROM usuario_intereses WHERE usuario_id = ?',
    [userId]
  );
  if (interests[0].count > 0) porcentaje += 25;

  await promisePool.execute(
    'UPDATE usuarios SET porcentaje_perfil = ? WHERE id = ?',
    [porcentaje, userId]
  );
}

module.exports = router;