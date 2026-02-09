
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    created_at: string;
    due_date?: string | null;
}

export const generateReceipt = (transaction: Transaction, payerName: string = 'Aluno(a)') => {
    const doc = new jsPDF();

    // -- Header --
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('RECIBO DE PAGAMENTO', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Sensei System', 105, 30, { align: 'center' });

    // -- Receipt Details --
    doc.setTextColor(0, 0, 0);

    // Box
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, 50, 180, 100);

    // Amount
    doc.setFontSize(14);
    doc.text(`VALOR: R$ ${transaction.amount.toFixed(2)}`, 180, 65, { align: 'right' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 65);

    doc.setTextColor(0, 0, 0);

    // Receipt Text body
    doc.setFontSize(12);
    const textStartY = 90;
    const lineHeight = 10;

    doc.text(`Recebemos de ${payerName.toUpperCase()}`, 20, textStartY);
    doc.text(`a importância de R$ ${transaction.amount.toFixed(2)}`, 20, textStartY + lineHeight);

    // Parse description from "[Category] Description"
    let description = transaction.category;
    const match = transaction.category.match(/^\[(.*?)\]\s*(.*)/);
    if (match) description = `${match[1]} - ${match[2]}`;

    doc.text(`Referente a: ${description}`, 20, textStartY + (lineHeight * 2));

    // Signature Line
    doc.setDrawColor(0, 0, 0);
    doc.line(60, 130, 150, 130);
    doc.setFontSize(10);
    doc.text('Assinatura / Carimbo', 105, 135, { align: 'center' });

    // System info footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID da Transação: ${transaction.id}`, 20, 145);
    doc.text('Gerado automaticamente pelo Sensei System', 20, 149);

    doc.save(`recibo_${transaction.id.slice(0, 8)}.pdf`);
};

export const exportToPDF = (
    transactions: Transaction[],
    dateRange: { start: Date; end: Date },
    summary: { incomePaid: number; incomePending: number; expensePaid: number; expensePending: number }
) => {
    const doc = new jsPDF();

    // Sort transactions by date (created_at or due_date)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Title
    doc.setFontSize(20);
    doc.text('Relatório Financeiro - Sensei', 14, 22);

    // Period
    doc.setFontSize(11);
    doc.text(`Período: ${format(dateRange.start, 'dd/MM/yyyy')} a ${format(dateRange.end, 'dd/MM/yyyy')}`, 14, 30);

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, 45);

    const summaryData = [
        ['Receitas Realizadas', `R$ ${summary.incomePaid.toFixed(2)}`],
        ['Receitas Pendentes', `R$ ${summary.incomePending.toFixed(2)}`],
        ['Despesas Pagas', `R$ ${summary.expensePaid.toFixed(2)}`],
        ['Despesas Pendentes', `R$ ${summary.expensePending.toFixed(2)}`],
        ['Balanço (Realizado)', `R$ ${(summary.incomePaid - summary.expensePaid).toFixed(2)}`],
        ['Balanço (Previsto)', `R$ ${(summary.incomePaid + summary.incomePending - summary.expensePaid - summary.expensePending).toFixed(2)}`]
    ];

    autoTable(doc, {
        startY: 50,
        head: [['Item', 'Valor']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [24, 24, 27] },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 50, halign: 'right' }
        }
    });

    // Transactions Table
    doc.text('Detalhamento das Transações', 14, (doc as any).lastAutoTable.finalY + 15);

    if (sortedTransactions.length === 0) {
        doc.setFontSize(10);
        doc.text('Nenhuma transação encontrada neste período.', 14, (doc as any).lastAutoTable.finalY + 25);
    } else {
        const tableData = sortedTransactions.map(t => {
            const date = format(new Date(t.created_at), 'dd/MM/yyyy');
            // Parse category if it's in the [Cat] Desc format
            let category = t.category;
            let desc = '';
            const match = t.category.match(/^\[(.*?)\]\s*(.*)/);
            if (match) {
                category = match[1];
                desc = match[2];
            }

            return [
                date,
                t.type === 'income' ? 'Entrada' : 'Saída',
                category,
                desc || t.category,
                `R$ ${t.amount.toFixed(2)}`,
                t.status === 'paid' ? 'Pago' : t.status === 'overdue' ? 'Vencido' : 'Pendente'
            ];
        });

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 20 }, // Data
                1: { cellWidth: 20 }, // Tipo
                2: { cellWidth: 30 }, // Categoria
                3: { cellWidth: 'auto' }, // Descrição
                4: { cellWidth: 25, halign: 'right' }, // Valor
                5: { cellWidth: 20 }  // Status
            }
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(`relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToExcel = (transactions: Transaction[]) => {
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const data = sortedTransactions.map(t => {
        let category = t.category;
        let description = '';
        const match = t.category.match(/^\[(.*?)\]\s*(.*)/);
        if (match) {
            category = match[1];
            description = match[2];
        }

        return {
            Data: format(new Date(t.created_at), 'dd/MM/yyyy'),
            Tipo: t.type === 'income' ? 'Entrada' : 'Saída',
            Categoria: category,
            Descrição: description || t.category,
            Valor: t.amount,
            Status: t.status === 'paid' ? 'Pago' : t.status === 'overdue' ? 'Vencido' : 'Pendente',
            'Data Vencimento': t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    XLSX.writeFile(workbook, `relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
