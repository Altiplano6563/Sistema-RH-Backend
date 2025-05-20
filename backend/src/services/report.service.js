// Implementação do serviço de exportação de relatórios
const { Employee, Department, Position, Movement } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class ReportService {
  /**
   * Gera relatório de colaboradores
   * @param {string} tenantId - ID do tenant
   * @param {Object} filters - Filtros para o relatório
   * @param {string} format - Formato do relatório (csv, excel, pdf)
   * @returns {Object} - Caminho do arquivo gerado e metadados
   */
  async generateEmployeeReport(tenantId, filters = {}, format = 'csv') {
    try {
      // Construir cláusula where com base nos filtros
      const whereClause = { tenantId };
      
      if (filters.status) {
        whereClause.status = filters.status;
      } else {
        whereClause.status = 'ativo'; // Por padrão, apenas ativos
      }
      
      if (filters.departamentoId) {
        whereClause.departamentoId = filters.departamentoId;
      }
      
      if (filters.cargoId) {
        whereClause.cargoId = filters.cargoId;
      }
      
      if (filters.modalidadeTrabalho) {
        whereClause.modalidadeTrabalho = filters.modalidadeTrabalho;
      }
      
      if (filters.cargaHoraria) {
        whereClause.cargaHoraria = filters.cargaHoraria;
      }
      
      // Buscar colaboradores com relacionamentos
      const employees = await Employee.findAll({
        where: whereClause,
        include: [
          {
            model: Department,
            as: 'departamento',
            attributes: ['nome']
          },
          {
            model: Position,
            as: 'cargo',
            attributes: ['nome', 'nivel']
          }
        ],
        order: [['nome', 'ASC']],
        raw: true,
        nest: true
      });
      
      // Preparar dados para o relatório
      const reportData = employees.map(employee => ({
        id: employee.id,
        nome: employee.nome,
        email: employee.email,
        cpf: employee.cpf,
        dataNascimento: employee.dataNascimento,
        genero: employee.genero,
        telefone: employee.telefone,
        departamento: employee.departamento.nome,
        cargo: employee.cargo.nome,
        nivel: employee.cargo.nivel,
        salario: employee.salario,
        dataAdmissao: employee.dataAdmissao,
        modalidadeTrabalho: employee.modalidadeTrabalho,
        cargaHoraria: employee.cargaHoraria,
        status: employee.status
      }));
      
      // Gerar relatório no formato solicitado
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportDir = path.join(__dirname, '..', '..', 'reports');
      
      // Criar diretório de relatórios se não existir
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      let filePath;
      let mimeType;
      
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = await this.generateCSV(reportData, `colaboradores_${timestamp}.csv`, reportDir);
          mimeType = 'text/csv';
          break;
        case 'excel':
          filePath = await this.generateExcel(reportData, `colaboradores_${timestamp}.xlsx`, reportDir);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          filePath = await this.generatePDF(reportData, `colaboradores_${timestamp}.pdf`, reportDir);
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Formato de relatório não suportado');
      }
      
      logger.info('Relatório de colaboradores gerado', { 
        tenantId, 
        format, 
        filePath,
        recordCount: reportData.length
      });
      
      return {
        filePath,
        fileName: path.basename(filePath),
        mimeType,
        recordCount: reportData.length,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Erro ao gerar relatório de colaboradores', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Gera relatório de movimentações
   * @param {string} tenantId - ID do tenant
   * @param {Object} filters - Filtros para o relatório
   * @param {string} format - Formato do relatório (csv, excel, pdf)
   * @returns {Object} - Caminho do arquivo gerado e metadados
   */
  async generateMovementReport(tenantId, filters = {}, format = 'csv') {
    try {
      // Construir cláusula where com base nos filtros
      const whereClause = { tenantId };
      
      if (filters.tipo) {
        whereClause.tipo = filters.tipo;
      }
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.dataInicio && filters.dataFim) {
        whereClause.dataEfetivacao = {
          [Op.between]: [filters.dataInicio, filters.dataFim]
        };
      } else if (filters.dataInicio) {
        whereClause.dataEfetivacao = {
          [Op.gte]: filters.dataInicio
        };
      } else if (filters.dataFim) {
        whereClause.dataEfetivacao = {
          [Op.lte]: filters.dataFim
        };
      }
      
      // Buscar movimentações com relacionamentos
      const movements = await Movement.findAll({
        where: whereClause,
        include: [
          {
            model: Employee,
            as: 'colaborador',
            attributes: ['nome', 'email']
          },
          {
            model: User,
            as: 'aprovador',
            attributes: ['nome', 'email']
          }
        ],
        order: [['dataEfetivacao', 'DESC']],
        raw: true,
        nest: true
      });
      
      // Preparar dados para o relatório
      const reportData = movements.map(movement => ({
        id: movement.id,
        colaborador: movement.colaborador.nome,
        email: movement.colaborador.email,
        tipo: movement.tipo,
        dataEfetivacao: movement.dataEfetivacao,
        valorAnterior: JSON.stringify(movement.valorAnterior),
        valorNovo: JSON.stringify(movement.valorNovo),
        motivo: movement.motivo,
        observacoes: movement.observacoes,
        aprovador: movement.aprovador ? movement.aprovador.nome : 'N/A',
        status: movement.status,
        dataCriacao: movement.dataCriacao
      }));
      
      // Gerar relatório no formato solicitado
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportDir = path.join(__dirname, '..', '..', 'reports');
      
      // Criar diretório de relatórios se não existir
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      let filePath;
      let mimeType;
      
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = await this.generateCSV(reportData, `movimentacoes_${timestamp}.csv`, reportDir);
          mimeType = 'text/csv';
          break;
        case 'excel':
          filePath = await this.generateExcel(reportData, `movimentacoes_${timestamp}.xlsx`, reportDir);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          filePath = await this.generatePDF(reportData, `movimentacoes_${timestamp}.pdf`, reportDir);
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Formato de relatório não suportado');
      }
      
      logger.info('Relatório de movimentações gerado', { 
        tenantId, 
        format, 
        filePath,
        recordCount: reportData.length
      });
      
      return {
        filePath,
        fileName: path.basename(filePath),
        mimeType,
        recordCount: reportData.length,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Erro ao gerar relatório de movimentações', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Gera arquivo CSV a partir dos dados
   * @param {Array} data - Dados para o relatório
   * @param {string} fileName - Nome do arquivo
   * @param {string} dir - Diretório para salvar o arquivo
   * @returns {string} - Caminho do arquivo gerado
   */
  async generateCSV(data, fileName, dir) {
    try {
      const filePath = path.join(dir, fileName);
      const fields = Object.keys(data[0]);
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      
      fs.writeFileSync(filePath, csv);
      return filePath;
    } catch (error) {
      logger.error('Erro ao gerar arquivo CSV', { error: error.message });
      throw error;
    }
  }

  /**
   * Gera arquivo Excel a partir dos dados
   * @param {Array} data - Dados para o relatório
   * @param {string} fileName - Nome do arquivo
   * @param {string} dir - Diretório para salvar o arquivo
   * @returns {string} - Caminho do arquivo gerado
   */
  async generateExcel(data, fileName, dir) {
    try {
      const filePath = path.join(dir, fileName);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório');
      
      // Adicionar cabeçalhos
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      // Formatar cabeçalhos
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Adicionar dados
      data.forEach(item => {
        const row = [];
        headers.forEach(header => {
          row.push(item[header]);
        });
        worksheet.addRow(row);
      });
      
      // Ajustar largura das colunas
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Salvar arquivo
      await workbook.xlsx.writeFile(filePath);
      return filePath;
    } catch (error) {
      logger.error('Erro ao gerar arquivo Excel', { error: error.message });
      throw error;
    }
  }

  /**
   * Gera arquivo PDF a partir dos dados
   * @param {Array} data - Dados para o relatório
   * @param {string} fileName - Nome do arquivo
   * @param {string} dir - Diretório para salvar o arquivo
   * @returns {string} - Caminho do arquivo gerado
   */
  async generatePDF(data, fileName, dir) {
    try {
      const filePath = path.join(dir, fileName);
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      
      // Criar stream para salvar o arquivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Adicionar título
      doc.fontSize(16).text('Relatório', { align: 'center' });
      doc.moveDown();
      
      // Obter cabeçalhos
      const headers = Object.keys(data[0]);
      
      // Calcular largura das colunas
      const tableWidth = doc.page.width - 60;
      const colWidth = tableWidth / Math.min(headers.length, 5); // Limitar a 5 colunas por página
      
      // Função para adicionar uma linha da tabela
      const addTableRow = (items, isHeader = false) => {
        const y = doc.y;
        let x = 30;
        
        items.forEach((item, i) => {
          // Limitar a 5 colunas por página
          if (i < 5) {
            doc.y = y;
            doc.x = x;
            
            if (isHeader) {
              doc.font('Helvetica-Bold').text(item, { width: colWidth - 5 });
            } else {
              doc.font('Helvetica').text(item ? item.toString() : '', { width: colWidth - 5 });
            }
            
            x += colWidth;
          }
        });
        
        doc.moveDown();
        
        // Adicionar linha separadora
        doc.moveTo(30, doc.y)
           .lineTo(30 + tableWidth, doc.y)
           .stroke();
        
        doc.moveDown(0.5);
      };
      
      // Adicionar cabeçalhos
      addTableRow(headers, true);
      
      // Adicionar dados
      data.forEach((row, index) => {
        // Verificar se precisa de nova página
        if (doc.y > doc.page.height - 50) {
          doc.addPage();
        }
        
        const rowData = headers.map(header => row[header]);
        addTableRow(rowData);
      });
      
      // Adicionar rodapé
      doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
      
      // Finalizar documento
      doc.end();
      
      // Aguardar finalização da escrita
      return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Erro ao gerar arquivo PDF', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ReportService();
