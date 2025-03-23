document.addEventListener('DOMContentLoaded', () => {
    const materialForm = document.getElementById('materialForm');
    const materialList = document.getElementById('materialList');
    const totalValue = document.getElementById('total-value');
    const filterCategoria = document.getElementById('filterCategoria');
    const savedBudgetsList = document.getElementById('savedBudgetsList');
    let materiais = [];
    
    // Material consumption rates per m² (based on construction standards)
    const consumoPorM2 = {
        'areia': 0.0617, // m³ por m² para alvenaria
        'cimento': 11.2, // kg por m² para alvenaria
        'tijolo': 25, // unidades por m² para alvenaria
        'argamassa': 18 // kg por m² para alvenaria
    };

    // Waste factors for different materials
    const fatorPerda = {
        'areia': 1.15, // 15% de perda
        'cimento': 1.15,
        'tijolo': 1.10,
        'argamassa': 1.15,
        'acabamento': 1.10
    };
    
    // Load saved budgets
    const loadSavedBudgets = () => {
        const savedBudgets = JSON.parse(localStorage.getItem('savedBudgets') || '[]');
        savedBudgetsList.innerHTML = '';
        savedBudgets.forEach((budget, index) => {
            const budgetElement = document.createElement('div');
            budgetElement.className = 'saved-budget-item';
            budgetElement.innerHTML = `
                <h3>Orçamento ${index + 1}</h3>
                <p>Total: R$ ${budget.total.toFixed(2)}</p>
                <p>Data: ${new Date(budget.date).toLocaleDateString()}</p>
                <button onclick="carregarOrcamento(${index})" class="btn btn-secondary">Carregar</button>
                <button onclick="excluirOrcamento(${index})" class="btn btn-primary">Excluir</button>
            `;
            savedBudgetsList.appendChild(budgetElement);
        });
    };

    materialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const categoria = document.getElementById('categoria').value;
        const material = document.getElementById('material').value.toLowerCase();
        const quantidade = parseFloat(document.getElementById('quantidade').value);
        const unidade = document.getElementById('unidade').value;
        const preco = parseFloat(document.getElementById('preco').value);
        const area = parseFloat(document.getElementById('area').value) || 0;
        
        let novoMaterial = {
            categoria,
            material,
            quantidade,
            unidade,
            preco,
            area,
            total: area > 0 ? area * quantidade * preco : quantidade * preco,
            porMetroQuadrado: area > 0 ? quantidade / area : 0
        };

        // Calculate quantities based on area and material type
        if (area > 0) {
            const consumo = consumoPorM2[material] || 0;
            const perda = fatorPerda[categoria] || 1.1;
            
            if (consumo > 0) {
                novoMaterial.quantidade = Math.ceil(area * consumo * perda);
                novoMaterial.porMetroQuadrado = consumo;
                novoMaterial.total = calculateTotal(novoMaterial.quantidade, preco, area);
            } else if (categoria === 'acabamento') {
                novoMaterial.quantidade = Math.ceil(area * novoMaterial.porMetroQuadrado * perda);
                novoMaterial.total = calculateTotal(novoMaterial.quantidade, preco, area);
            }
        } else {
            // When area is not provided, simply multiply quantity by price
            novoMaterial.total = quantidade * preco;
        }
        
        materiais.push(novoMaterial);
        atualizarLista();
        
        // Clear only the numeric input fields
        document.getElementById('quantidade').value = '';
        document.getElementById('preco').value = '';
        document.getElementById('area').value = '';
    });

    filterCategoria.addEventListener('change', atualizarLista);
    
    function atualizarLista() {
        const categoriaFiltrada = filterCategoria.value;
        const fragment = document.createDocumentFragment();
        let total = 0;
        
        const materiaisFiltrados = categoriaFiltrada === 'todos' 
            ? materiais 
            : materiais.filter(item => item.categoria === categoriaFiltrada);

        if (materiaisFiltrados.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'alert alert-info';
            emptyMessage.textContent = 'Nenhum material encontrado';
            fragment.appendChild(emptyMessage);
        } else {
            materiaisFiltrados.forEach((item, index) => {
                const materialItem = document.createElement('div');
                materialItem.className = 'material-item';
                materialItem.innerHTML = `
                    <div class="material-info">
                        <strong class="material-name">${item.material}</strong> 
                        <span class="material-category">(${item.categoria})</span><br>
                        <span class="material-details">
                            ${item.quantidade} ${item.unidade} x R$ ${item.preco.toFixed(2)}
                            ${item.area ? `<br>Área: ${item.area}m² (${item.porMetroQuadrado.toFixed(2)} por m²)` : ''}
                        </span>
                    </div>
                    <div class="material-actions">
                        <strong class="material-total">R$ ${item.total.toFixed(2)}</strong>
                        <button onclick="removerMaterial(${index})" class="btn btn-danger btn-sm" 
                                title="Remover material">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                `;
                fragment.appendChild(materialItem);
                total += item.total;
            });
        }

        materialList.innerHTML = '';
        materialList.appendChild(fragment);
        totalValue.textContent = `R$ ${total.toFixed(2)}`;
    }

    window.removerMaterial = (index) => {
        materiais.splice(index, 1);
        atualizarLista();
    };

    window.salvarOrcamento = () => {
        if (materiais.length === 0) {
            alert('Adicione materiais ao orçamento antes de salvar.');
            return;
        }

        const savedBudgets = JSON.parse(localStorage.getItem('savedBudgets') || '[]');
        const total = materiais.reduce((sum, item) => sum + item.total, 0);
        
        savedBudgets.push({
            materiais: [...materiais],
            total,
            date: new Date().toISOString()
        });

        localStorage.setItem('savedBudgets', JSON.stringify(savedBudgets));
        loadSavedBudgets();
        alert('Orçamento salvo com sucesso!');
    };

    window.carregarOrcamento = (index) => {
        const savedBudgets = JSON.parse(localStorage.getItem('savedBudgets') || '[]');
        materiais = [...savedBudgets[index].materiais];
        atualizarLista();
    };

    window.excluirOrcamento = (index) => {
        const savedBudgets = JSON.parse(localStorage.getItem('savedBudgets') || '[]');
        savedBudgets.splice(index, 1);
        localStorage.setItem('savedBudgets', JSON.stringify(savedBudgets));
        loadSavedBudgets();
    };

    window.exportarPDF = () => {
        if (materiais.length === 0) {
            alert('Adicione materiais ao orçamento antes de exportar.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Orçamento ConstruFácil', 20, 20);
        
        doc.setFontSize(12);
        let yPos = 40;
        let total = 0;

        materiais.forEach((item) => {
            doc.text(`${item.material} (${item.categoria})`, 20, yPos);
            doc.text(`${item.quantidade} x R$ ${item.preco.toFixed(2)} = R$ ${item.total.toFixed(2)}`, 20, yPos + 7);
            if (item.area > 0) {
                doc.text(`Área: ${item.area}m² (${item.porMetroQuadrado.toFixed(2)} por m²)`, 20, yPos + 14);
                yPos += 7;
            }
            yPos += 20;
            total += item.total;
        });

        doc.setFontSize(14);
        doc.text(`Total: R$ ${total.toFixed(2)}`, 20, yPos);
        
        doc.save('orcamento-construfacil.pdf');
    };

    window.compartilharViaWhatsApp = () => {
        if (materiais.length === 0) {
            alert('Adicione materiais ao orçamento antes de compartilhar.');
            return;
        }

        let mensagem = 'Orçamento ConstruFácil\n\n';
        let total = 0;

        materiais.forEach((item) => {
            mensagem += `${item.material} (${item.categoria})\n`;
            mensagem += `${item.quantidade} x R$ ${item.preco.toFixed(2)} = R$ ${item.total.toFixed(2)}\n`;
            if (item.area > 0) {
                mensagem += `Área: ${item.area}m² (${item.porMetroQuadrado.toFixed(2)} por m²)\n`;
            }
            mensagem += '\n';
            total += item.total;
        });

        mensagem += `Total: R$ ${total.toFixed(2)}`;

        const encodedMessage = encodeURIComponent(mensagem);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    // Initialize saved budgets list
    loadSavedBudgets();
});