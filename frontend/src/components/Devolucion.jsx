// src/components/Devolucion.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import '../styles_components/Devolucion.css'; 

const Devolucion = () => {
  // Estado para la búsqueda de factura
  const [numeroFactura, setNumeroFactura] = useState('');
  const [productosVenta, setProductosVenta] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [formData, setFormData] = useState({
    id_venta: '',
    id_producto: '',
    id_usuario: '',
    cantidad: 1,
    motivo: '',
    observaciones: '',
    monto_reembolso: ''
  });

  const motivosEstandar = [
    "Selecciona un motivo...",
    "Garantía / Defecto de fábrica",
    "Cambio de talla o color",
    "Insatisfacción con el producto",
    "Producto equivocado / Error de envío"
  ];

  // 1. Lógica para buscar la factura y autocompletar IDs
  const buscarFactura = async () => {
    if (!numeroFactura) return alert('Ingresa un número de factura');
    
    try {
      // Nota: Este endpoint debe existir en tu backend para traer los detalles de la venta
      const response = await fetch(`http://localhost:5000/api/ventas/${numeroFactura}/detalles`);
      
      if (response.ok) {
        const data = await response.json();
        // Asignamos automáticamente los IDs de la venta y del usuario (cliente)
        setFormData(prev => ({ 
          ...prev, 
          id_venta: data.id_venta, 
          id_usuario: data.id_usuario 
        }));
        // Guardamos los productos que pertenecen a esta factura para el Select
        setProductosVenta(data.productos);
      } else {
        alert('Factura no encontrada. Verifica el número.');
        setProductosVenta([]);
      }
    } catch (error) {
      console.error('Error buscando factura:', error);
    }
  };

  // 2. Lógica al seleccionar un producto del Select
  const handleProductoChange = (e) => {
    const idProducto = parseInt(e.target.value);
    const producto = productosVenta.find(p => p.id_producto === idProducto);
    
    if (producto) {
      setProductoSeleccionado(producto);
      setFormData(prev => ({
        ...prev,
        id_producto: idProducto,
        cantidad: 1, // Por defecto al seleccionar, devuelve 1
        monto_reembolso: producto.precio_unitario * 1 // 3. Cálculo automático
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nuevosDatos = { ...formData, [name]: value };

    // 4. Recalcular el reembolso dinámicamente si cambian la cantidad
    if (name === 'cantidad' && productoSeleccionado) {
      nuevosDatos.monto_reembolso = productoSeleccionado.precio_unitario * Number(value);
    }

    setFormData(nuevosDatos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Devolución registrada con éxito.');
        // Limpiar formulario tras éxito
        setFormData({ id_venta: '', id_producto: '', id_usuario: '', cantidad: 1, motivo: '', observaciones: '', monto_reembolso: '' });
        setNumeroFactura('');
        setProductosVenta([]);
        setProductoSeleccionado(null);
      } else {
        alert('Error al registrar la devolución.');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
    }
  };

  return (
    <div className="admin-container">
      <Sidebar />

      <main className="main-content">
        <div className="page-header">
          <div className="breadcrumbs">Bizly / Devoluciones</div>
          <h1>Registro de Devoluciones</h1>
          <p className="subtitle">Procesa reembolsos buscando directamente el número de factura del cliente.</p>
        </div>

        <div className="devolucion-card">
          {/* BUSCADOR DE FACTURAS */}
          <div className="form-row" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div className="form-group" style={{ flex: '2', marginBottom: '0' }}>
              <label>Número de Factura / Recibo:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="number" 
                  className="bizly-input" 
                  placeholder="Ej. 1045" 
                  value={numeroFactura} 
                  onChange={(e) => setNumeroFactura(e.target.value)} 
                />
                <button type="button" onClick={buscarFactura} className="btn-secondary" style={{ padding: '0 20px', borderRadius: '8px' }}>
                  Buscar Factura
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="devolucion-form">
            
            <div className="form-row">
              <div className="form-group">
                <label>Producto a devolver: <span>*</span></label>
                <select 
                  name="id_producto" 
                  className="bizly-input" 
                  value={formData.id_producto} 
                  onChange={handleProductoChange} 
                  required
                  disabled={productosVenta.length === 0} // Se bloquea si no han buscado factura
                >
                  <option value="">{productosVenta.length === 0 ? "Busca una factura primero..." : "Selecciona el producto..."}</option>
                  {productosVenta.map(prod => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.nombre} (Compró: {prod.cantidad_comprada})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad a devolver: <span>*</span></label>
                <input 
                  type="number" 
                  name="cantidad" 
                  className="bizly-input" 
                  value={formData.cantidad} 
                  onChange={handleChange} 
                  min="1" 
                  max={productoSeleccionado ? productoSeleccionado.cantidad_comprada : ""} // Validación del máximo
                  disabled={!productoSeleccionado}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Monto a reembolsar ($):</label>
              <input 
                type="number" 
                name="monto_reembolso" 
                className="bizly-input" 
                value={formData.monto_reembolso} 
                readOnly // Solo lectura para evitar fraudes en caja
                style={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold' }} 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Motivo principal: <span>*</span></label>
                <select name="motivo" className="bizly-input" value={formData.motivo} onChange={handleChange} required>
                  {motivosEstandar.map((mot, index) => (
                    <option key={index} value={index === 0 ? "" : mot} disabled={index === 0}>{mot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones adicionales (Opcional):</label>
              <textarea name="observaciones" className="bizly-input textarea-motivo" value={formData.observaciones} onChange={handleChange} rows="2" placeholder="Detalles extra sobre el estado del producto..." />
            </div>

            <button type="submit" className="btn-primary-dev" disabled={!productoSeleccionado}>
              Procesar Devolución
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Devolucion;