const paises = [
    { "nombre": "espana", "impuesto": 0.21, "nombreMostrado": "España" },
    { "nombre": "francia", "impuesto": 0.20, "nombreMostrado": "Francia" },
    { "nombre": "portugal", "impuesto": 0.23, "nombreMostrado": "Portugal" },
    { "nombre": "italia", "impuesto": 0.22, "nombreMostrado": "Italia" }
];

let productos = JSON.parse(localStorage.getItem('productos')) || [
    { "nombre": "cluedo", "precio": 29.99, "stock": 13 },
    { "nombre": "monopoly", "precio": 35.00, "stock": 20 },
    { "nombre": "risk", "precio": 38.95, "stock": 3 },
    { "nombre": "ajedrez", "precio": 9.99, "stock": 0 }
];

let monedaSeleccionada = localStorage.getItem('moneda') || 'eur';

let nuevosProductos = [];

function formatoPrecio(precio, moneda) {
    if (moneda === "usd") {
        return `$${precio.toFixed(2)}`;
    } else {
        return `${precio.toFixed(2).replace(".", ",")}€`;
    }
}

async function actualizarTablaMoneda(moneda) {
    const listaProductos = document.getElementById("productList");
    listaProductos.innerHTML = '';

    for (let producto of productos) {
        const fila = document.createElement("tr");
        const celdaNombre = document.createElement("td");
        celdaNombre.textContent = producto.nombre;
        fila.appendChild(celdaNombre);


        let precioMostrar = producto.precio;

        if (moneda === "usd") {
            if (producto.precioUSD) {
                precioMostrar = producto.precioUSD;
            } else {
                precioMostrar = Math.round((producto.precio / await obtenerTipoCambio('eur', 'USD')) * 100) / 100;
            }
        }

        const celdaPrecio = document.createElement("td");
        celdaPrecio.textContent = formatoPrecio(precioMostrar, moneda);
        fila.appendChild(celdaPrecio);

        const celdaStock = document.createElement("td");
        celdaStock.textContent = producto.stock;
        fila.appendChild(celdaStock);

        listaProductos.appendChild(fila);
    }
}



// La función obtenerTipoCambio ya está preparada para obtener el tipo de cambio desde euros a dólares.

async function calcularPrecio() {
    let nombreProductoSeleccionado = document.getElementById("searchBar").value;

    // Verifica si el nombre del producto está vacío
    if (!nombreProductoSeleccionado) {
        document.getElementById("mensajeError").innerText = ""; // Limpia el mensaje de error
        return;
    }

let productoSeleccionado = productos.find(producto => producto.nombre === nombreProductoSeleccionado);

    // Verifica si el producto está definido
    if (!productoSeleccionado) {
        document.getElementById("mensajeError").innerText = "Producto no encontrado.";
        document.getElementById("resultado").innerHTML = "";
        document.getElementById("contenedorMensajeError").innerText = "";
        return;
    }

    let pais = paises.find(p => p.nombre === document.getElementById("pais").value);
    let moneda = document.getElementById("moneda").value;
    let unidades = parseInt(document.getElementById("unidades").value, 10);

  if (productoSeleccionado.stock === 0) {
    document.getElementById("mensajeProductoAgotado").style.display = "block";
    document.getElementById("mensajeError").innerText = "";
    document.getElementById("resultado").innerHTML = "";
    document.getElementById("contenedorMensajeError").innerText = "";
    return;
} else {
    document.getElementById("mensajeProductoAgotado").style.display = "none";
}


    // Verifica si la cantidad seleccionada supera el stock disponible
    if (unidades > productoSeleccionado.stock) {
        document.getElementById("mensajeError").innerText = `El stock disponible para este producto es de ${productoSeleccionado.stock} unidades.`;
        document.getElementById("resultado").innerHTML = "";
        document.getElementById("contenedorMensajeError").innerText = "";
        return;
    } else if (unidades <= 0 || isNaN(unidades)) {
        document.getElementById("mensajeError").innerText = "Por favor, introduzca un número entero mayor o igual a 1";
        document.getElementById("resultado").innerHTML = "";
        document.getElementById("contenedorMensajeError").innerText = "";
        return;
    } else {
        document.getElementById("mensajeError").innerText = "";
    }

    // Si se llega aquí, se calculan los precios como antes
    let precioSinIVA = productoSeleccionado.precio * unidades;

// Asegurarse de que el precio sin IVA se convierte correctamente si la moneda es USD
if (moneda === "usd") {
    precioSinIVA = productoSeleccionado.precioUSD || precioSinIVA / await obtenerTipoCambio('eur', 'USD');
}

let precioConIVA = precioSinIVA * (1 + pais.impuesto);  // Aplicar IVA

// Si la moneda seleccionada es USD, convertir los precios de EUR a USD
if (moneda === "usd") {
    precioConIVA = productoSeleccionado.precioUSD ? productoSeleccionado.precioUSD * unidades * (1 + pais.impuesto) : precioConIVA;
}


    let codigoDescuento = document.getElementById("codigoDescuento").value;
    if (!codigoDescuento) {
        mostrarPrecios(precioSinIVA, precioConIVA, null, moneda);
        return;
    }

    if (codigoDescuento !== "Bienvenid@23") {
        document.getElementById("contenedorMensajeError").innerText = "El código introducido no es válido";
        mostrarPrecios(precioSinIVA, precioConIVA, null, moneda);
        return;
    }

    let tasaDescuento = 0.9;  // 10% de descuento
    document.getElementById("contenedorMensajeError").innerText = "";

    let precioConIVAYDescuento = precioConIVA * tasaDescuento;
    mostrarPrecios(precioSinIVA, precioConIVA, precioConIVAYDescuento, moneda);

    // Determinar el formato del importe ahorrado para el Sweet Alert
    let importeAhorrado = precioConIVA - precioConIVAYDescuento;
    let formatoImporte = moneda === 'usd' ? `$${importeAhorrado.toFixed(2).replace(".", ",")}` : `${importeAhorrado.toFixed(2).replace(".", ",")}€`;

    // Mostrar SweetAlert
    Swal.fire({
        title: 'Código descuento aplicado',
        text: `Te has ahorrado ${formatoImporte}.`,
        icon: 'success',
        confirmButtonText: 'Entendido'
    });
}


function mostrarPrecios(precioSinIVA, precioConIVA, precioConDescuento, moneda) {
    let mensaje = `Precio total sin IVA: ${formatoPrecio(precioSinIVA, moneda)}<br>
                   Precio total con IVA: ${formatoPrecio(precioConIVA, moneda)}`;

    if (precioConDescuento !== null) {
        mensaje += `<br>Precio con IVA y descuento (si aplica): ${formatoPrecio(precioConDescuento, moneda)}`;
    }

    document.getElementById("resultado").innerHTML = mensaje;
}

async function obtenerTipoCambio(monedaOrigen, monedaDestino) {
    try {
        const respuesta = await fetch(`https://v6.exchangerate-api.com/v6/9a9defd847f1fc9ff9c49cdc/latest/${monedaOrigen}`);
        const datos = await respuesta.json();
        return datos.conversion_rates[monedaDestino.toUpperCase()];
    } catch (error) {
        console.error("Error al obtener el tipo de cambio:", error);
        return 1;
    }
}


function mostrarProductos() {
    const listaProductos = document.getElementById("productList");
    const filtro = document.getElementById("searchBar").value.toLowerCase();
    const moneda = document.getElementById("moneda").value;  // Obtener la moneda seleccionada

    productos.forEach(producto => {
        let fila = document.getElementById(`fila-${producto.nombre}`);
        if (!fila) {
            fila = document.createElement("tr");
            fila.id = `fila-${producto.nombre}`;
            listaProductos.appendChild(fila);
        }
        if (producto.nombre.toLowerCase().includes(filtro) || !filtro) {
            let precioMostrar = moneda === "usd" && producto.precioUSD ? producto.precioUSD : producto.precioEUR;
            fila.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${formatoPrecio(precioMostrar, moneda)}</td>
                <td>${producto.stock}</td>
            `;
        } else {
            fila.innerHTML = '';
        }
    });
}

document.getElementById("guardarProductoBtn").addEventListener("click", async function() {
    const nombre = document.getElementById("nombreProductoNuevo").value.trim();
    const precioInput = document.getElementById("precioProductoNuevo").value;
    const stockInput = document.getElementById("stockProductoNuevo").value;
    const moneda = document.getElementById("monedaProductoNuevo").value;

     // Verifica si el producto ya existe en la lista
    const productoExistente = productos.find(producto => producto.nombre.toLowerCase() === nombre.toLowerCase());


    if (productoExistente) {
        Swal.fire({
            title: 'Error',
            text: 'El producto ya existe en la lista.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;  // Sale de la función si el producto ya existe
    }

    if (!nombre) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, introduce un nombre válido para el producto.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(precioInput) || parseFloat(precioInput) < 0) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, introduce un precio válido (mayor o igual a 0 y con hasta dos decimales).',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    if (!/^\d+$/.test(stockInput) || parseInt(stockInput) < 0) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, introduce un número entero igual o superior a 0 para el stock.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }

    let precio = parseFloat(precioInput);  // El precio ya se ingresa en dólares

    // Convertir el precio a euros solo si se selecciona USD y almacenar el precio convertido
    if (moneda === 'usd') {
        precio = precio / await obtenerTipoCambio('eur', 'USD');
    }

    const producto = {
        "nombre": nombre,
        "precio": precio,
        "stock": parseInt(stockInput, 10)
    };

    // Almacenar el precio en la moneda seleccionada sin convertir
if (moneda === 'usd') {
    producto.precioUSD = parseFloat(precioInput);  // Guardar el precio en USD
} else {
    producto.precioEUR = precio;  // Guardar el precio en EUR
}

    productos.push(producto);
    actualizarListaAwesomplete()

    const fila = document.createElement("tr");
    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = nombre;
    const celdaPrecio = document.createElement("td");
    celdaPrecio.textContent = formatoPrecio(precio, moneda);  // Guardar el precio en la moneda seleccionada
    const celdaStock = document.createElement("td");
    celdaStock.textContent = stockInput;
    fila.appendChild(celdaNombre);
    fila.appendChild(celdaPrecio);
    fila.appendChild(celdaStock);
    document.getElementById("productList").appendChild(fila);

    document.getElementById("nombreProductoNuevo").value = "";
    document.getElementById("precioProductoNuevo").value = "";
    document.getElementById("stockProductoNuevo").value = "";
    Swal.fire({
        title: 'Producto añadido',
        text: 'El producto se ha añadido correctamente.',
        icon: 'success',
        confirmButtonText: 'Entendido'
    });

    localStorage.setItem('productos', JSON.stringify(productos));
});

document.getElementById('cancelarBtn').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('formContainer').style.display = 'none';
});

async function actualizarListaAwesomplete() {
    const listaProductos = productos.map(producto => producto.nombre).join(",");
    const searchBar = document.getElementById("searchBar");
    searchBar.setAttribute("data-list", listaProductos);
    new Awesomplete(searchBar);
}

function mostrarFormularioProducto() {
    document.getElementById("formularioProducto").style.display = "block";
}

function ocultarFormularioProducto() {
    document.getElementById("formularioProducto");
}

document.getElementById('agregarProductoBtn').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('formContainer').style.display = 'block';
});

document.getElementById('overlay').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('formContainer').style.display = 'none';
});

window.onload = async function() {
    Swal.fire({
        title: 'Enhorabuena',
        text: 'Usando el código Bienvenid@23 obtienes un 10% de descuento en tu próxima compra.',
        icon: 'info',
        confirmButtonText: 'Entendido'
    });
    await actualizarTablaMoneda(monedaSeleccionada);
document.getElementById("moneda").addEventListener("change", async function() {
    monedaSeleccionada = this.value;

    // Guardamos la moneda seleccionada en el almacenamiento local.
    localStorage.setItem('moneda', monedaSeleccionada);

    // Actualizamos la tabla para mostrar los productos en la moneda seleccionada.
    actualizarTablaMoneda(monedaSeleccionada);
});

    document.getElementById("calcularPrecioBtn").addEventListener("click", calcularPrecio);
    document.getElementById("agregarProductoBtn").addEventListener("click", function() {
        const formularioProducto = document.getElementById("formularioProducto");
        formularioProducto.style.display = formularioProducto.style.display === "none" ? "block" : "none";
    });
};
