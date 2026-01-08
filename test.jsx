import React, { useState, useRef } from 'react';
import { GripVertical, Eye, Edit, Save, Plus, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';

// Placeholder invoice data
const PLACEHOLDER_DATA = {
  header: {
    companyName: "Test Distributor",
    invoiceType: "Commercial Invoice",
    cnic: "12345-6789012-3",
    phone: "0321-1234567",
    address: "Potohhar Rd, I-8/3 I-9 I-9, Islamabad, 44000, Pakistan",
    invoiceNo: "OBD97395",
    bookingDate: "2026-01-08",
    deliveryDate: "2026-01-08",
    booker: "waqas",
    salesman: "waqas",
    customerName: "Waqas Gs (Waqas)",
    tcn: "TCN30317"
  },
  lineItems: [
    {
      sku: "ISLAMABAD TEA LEAF BLEND 430 GM",
      ctSize: "24",
      ctn: 5,
      pcs: 0,
      rp: 851,
      tp: 102120,
      tpVal: 2400.00,
      tradeOffer: 1548.00,
      slabDisc: 98172,
      grossValue: 490.86,
      others: 98663,
      getValue: 0,
      advanceTax: 0,
      gst: 0
    },
    {
      sku: "REFINED PINK SALT 800 GM",
      ctSize: "24",
      ctn: 0,
      pcs: 1,
      rp: 55,
      tp: 55,
      tpVal: 19.33,
      tradeOffer: 0.00,
      slabDisc: 35.67,
      grossValue: 0.18,
      others: 36,
      getValue: 0,
      advanceTax: 0,
      gst: 0
    },
    {
      sku: "PREMIUM GREEN TEA 250 GM",
      ctSize: "12",
      ctn: 3,
      pcs: 0,
      rp: 450,
      tp: 5400,
      tpVal: 1200.00,
      tradeOffer: 540.00,
      slabDisc: 4860,
      grossValue: 250.00,
      others: 5110,
      getValue: 0,
      advanceTax: 0,
      gst: 0
    }
  ],
  summary: {
    totalQty: "8Ctn, 1 Pcs",
    tpValue: 102226.00,
    totalDiscount: 3948.00,
    grossValue: 98278.00,
    others: 490.86,
    netValue: 98662.86
  }
};

// Available fields for each section
const AVAILABLE_FIELDS = {
  header: {
    topRow: [
      { id: 'companyName', label: 'Company/Distributor Name' },
      { id: 'invoiceType', label: 'Invoice Type' }
    ],
    left: [
      { id: 'customerName', label: 'Customer Name' },
      { id: 'cnic', label: 'CNIC' },
      { id: 'phone', label: 'Phone' },
      { id: 'address', label: 'Address' }
    ],
    right: [
      { id: 'tcn', label: 'TCN' },
      { id: 'invoiceNo', label: 'Invoice No' },
      { id: 'bookingDate', label: 'Booking' },
      { id: 'deliveryDate', label: 'Delivery' },
      { id: 'booker', label: 'Booker' },
      { id: 'salesman', label: 'Salesman' }
    ]
  },
  lineItems: [
    { id: 'sku', label: 'SKU / Product', type: 'text' },
    { id: 'ctSize', label: 'Ct.Size', type: 'text' },
    { id: 'ctn', label: 'Ctn', type: 'number' },
    { id: 'pcs', label: 'Pcs', type: 'number' },
    { id: 'rp', label: 'R.P', type: 'number' },
    { id: 'tp', label: 'T.P', type: 'number' },
    { id: 'tpVal', label: 'TP Val', type: 'number' },
    { id: 'tradeOffer', label: 'Trade Offer', type: 'number' },
    { id: 'slabDisc', label: 'Slab Disc', type: 'number' },
    { id: 'grossValue', label: 'Gross Value', type: 'number' },
    { id: 'others', label: 'Others', type: 'number' },
    { id: 'getValue', label: 'Get Value', type: 'number' },
    { id: 'advanceTax', label: 'Advance Tax', type: 'number' },
    { id: 'gst', label: 'GST', type: 'number' }
  ],
  summary: [
    { id: 'totalQty', label: 'Total Qty' },
    { id: 'tpValue', label: 'TP Value' },
    { id: 'totalDiscount', label: 'Total Discount' },
    { id: 'grossValue', label: 'Gross Value' },
    { id: 'others', label: 'Others' },
    { id: 'netValue', label: 'Net Value' }
  ]
};

const InvoiceTemplateCreator = () => {
  const [mode, setMode] = useState('edit');
  const [templateName, setTemplateName] = useState('New Template');
  const printRef = useRef(null);
  
  // Template configuration
  const [template, setTemplate] = useState({
    header: {
      topRow: ['companyName', 'invoiceType'],
      left: ['customerName', 'cnic', 'phone', 'address'],
      right: ['tcn', 'invoiceNo', 'bookingDate', 'deliveryDate', 'booker', 'salesman']
    },
    lineItems: ['sku', 'ctn', 'pcs', 'rp', 'tp', 'tpVal', 'tradeOffer', 'slabDisc', 'grossValue', 'others', 'getValue'],
    summary: ['totalQty', 'tpValue', 'totalDiscount', 'grossValue', 'others', 'netValue'],
    showCtSize: true,
    summaryLayout: 'split', // 'split' or 'full'
    fontSize: 9,
    showTableBorders: false
  });

  const [expandedSections, setExpandedSections] = useState({
    header: true,
    lineItems: true,
    summary: true
  });

  const toggleField = (section, subsection, field) => {
    if (section === 'header') {
      setTemplate(prev => ({
        ...prev,
        header: {
          ...prev.header,
          [subsection]: prev.header[subsection].includes(field)
            ? prev.header[subsection].filter(f => f !== field)
            : [...prev.header[subsection], field]
        }
      }));
    } else {
      setTemplate(prev => ({
        ...prev,
        [section]: prev[section].includes(field)
          ? prev[section].filter(f => f !== field)
          : [...prev[section], field]
      }));
    }
  };

  const moveField = (section, subsection, field, direction) => {
    if (section === 'header') {
      const arr = [...template.header[subsection]];
      const index = arr.indexOf(field);
      if (direction === 'up' && index > 0) {
        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      } else if (direction === 'down' && index < arr.length - 1) {
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      }
      setTemplate(prev => ({
        ...prev,
        header: { ...prev.header, [subsection]: arr }
      }));
    } else {
      const arr = [...template[section]];
      const index = arr.indexOf(field);
      if (direction === 'up' && index > 0) {
        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
      } else if (direction === 'down' && index < arr.length - 1) {
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      }
      setTemplate(prev => ({ ...prev, [section]: arr }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const saveTemplate = () => {
    console.log('Saving template:', { name: templateName, config: template });
    alert('Template saved! (In production, this would save to your backend)');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Editor Panel */}
      <div className={`${mode === 'edit' ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-white`}>
        <div className="p-4 border-b">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg font-semibold"
            placeholder="Template Name"
          />
        </div>

        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {/* Header Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('header')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
            >
              <span className="font-semibold">Header Fields</span>
              {expandedSections.header ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.header && (
              <div className="p-4 space-y-4">
                {/* Top Row */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Row</div>
                  {AVAILABLE_FIELDS.header.topRow.map(field => {
                    const isActive = template.header.topRow.includes(field.id);
                    const index = template.header.topRow.indexOf(field.id);
                    return (
                      <div key={field.id} className={`flex items-center gap-2 p-2 rounded mb-2 ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleField('header', 'topRow', field.id)}
                          className="rounded"
                        />
                        <span className="flex-1 text-sm">{field.label}</span>
                        {isActive && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveField('header', 'topRow', field.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-white rounded disabled:opacity-30"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveField('header', 'topRow', field.id, 'down')}
                              disabled={index === template.header.topRow.length - 1}
                              className="p-1 hover:bg-white rounded disabled:opacity-30"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Left Column */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Left Column</div>
                  {AVAILABLE_FIELDS.header.left.map(field => {
                    const isActive = template.header.left.includes(field.id);
                    const index = template.header.left.indexOf(field.id);
                    return (
                      <div key={field.id} className={`flex items-center gap-2 p-2 rounded mb-2 ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleField('header', 'left', field.id)}
                          className="rounded"
                        />
                        <span className="flex-1 text-sm">{field.label}</span>
                        {isActive && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveField('header', 'left', field.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-white rounded disabled:opacity-30"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveField('header', 'left', field.id, 'down')}
                              disabled={index === template.header.left.length - 1}
                              className="p-1 hover:bg-white rounded disabled:opacity-30"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Column */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Right Column</div>
                  {AVAILABLE_FIELDS.header.right.map(field => {
                    const isActive = template.header.right.includes(field.id);
                    const index = template.header.right.indexOf(field.id);
                    return (
                      <div key={field.id} className={`flex items-center gap-2 p-2 rounded mb-2 ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleField('header', 'right', field.id)}
                          className="rounded"
                        />
                        <span className="flex-1 text-sm">{field.label}</span>
                        {isActive && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveField('header', 'right', field.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-white rounded disabled:opacity-30"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveField('header', 'right', field.id, 'down')}
                              disabled={index === template.header.right.length - 1}
                              className="p-1 hover:bg-white rounded disabled:opacity-30"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Line Items Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('lineItems')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
            >
              <span className="font-semibold">Table Columns</span>
              {expandedSections.lineItems ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.lineItems && (
              <div className="p-4 space-y-2">
                <div className="mb-3 p-2 bg-blue-50 rounded">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={template.showCtSize}
                      onChange={(e) => setTemplate(prev => ({ ...prev, showCtSize: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm font-semibold">Show Ct.Size under SKU name</span>
                  </label>
                </div>
                {AVAILABLE_FIELDS.lineItems.map(field => {
                  const isActive = template.lineItems.includes(field.id);
                  const index = template.lineItems.indexOf(field.id);
                  return (
                    <div key={field.id} className={`flex items-center gap-2 p-2 rounded ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleField('lineItems', null, field.id)}
                        className="rounded"
                      />
                      <span className="flex-1 text-sm">{field.label}</span>
                      {isActive && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveField('lineItems', null, field.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-white rounded disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveField('lineItems', null, field.id, 'down')}
                            disabled={index === template.lineItems.length - 1}
                            className="p-1 hover:bg-white rounded disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="border-b">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
            >
              <span className="font-semibold">Summary Fields</span>
              {expandedSections.summary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.summary && (
              <div className="p-4 space-y-2">
                {AVAILABLE_FIELDS.summary.map(field => {
                  const isActive = template.summary.includes(field.id);
                  const index = template.summary.indexOf(field.id);
                  return (
                    <div key={field.id} className={`flex items-center gap-2 p-2 rounded ${isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleField('summary', null, field.id)}
                        className="rounded"
                      />
                      <span className="flex-1 text-sm">{field.label}</span>
                      {isActive && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveField('summary', null, field.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-white rounded disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveField('summary', null, field.id, 'down')}
                            disabled={index === template.summary.length - 1}
                            className="p-1 hover:bg-white rounded disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Summary Layout</label>
              <select
                value={template.summaryLayout}
                onChange={(e) => setTemplate(prev => ({ ...prev, summaryLayout: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="split">Split (Summary + Sign Area)</option>
                <option value="full">Full Width Summary</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Font Size</label>
              <input
                type="range"
                min="7"
                max="12"
                value={template.fontSize}
                onChange={(e) => setTemplate(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600">{template.fontSize}px</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={template.showTableBorders}
                onChange={(e) => setTemplate(prev => ({ ...prev, showTableBorders: e.target.checked }))}
                className="rounded"
              />
              <label className="text-sm">Show Table Borders</label>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={saveTemplate}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Save Template
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${mode === 'edit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              <Edit size={18} />
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${mode === 'preview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              <Eye size={18} />
              Preview
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Print / PDF
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div
            ref={printRef}
            className="bg-white mx-auto shadow-lg print:shadow-none"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '12mm',
              fontSize: `${template.fontSize}px`
            }}
          >
            {/* Top Border */}
            <div className="border-t-2 border-b-2 border-black py-2 mb-3">
              <div className="flex justify-between items-center">
                <div className="flex-1 text-center font-bold text-lg">
                  {template.header.topRow.map((fieldId, idx) => (
                    <span key={fieldId}>
                      {idx > 0 && <span className="mx-4"></span>}
                      {PLACEHOLDER_DATA.header[fieldId]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Header Info */}
            <div className="border-b-2 border-black pb-3 mb-3">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-1">
                  {template.header.left.map(fieldId => {
                    const field = AVAILABLE_FIELDS.header.left.find(f => f.id === fieldId);
                    return (
                      <div key={fieldId} className="text-xs">
                        <span className="font-semibold">{field.label}: </span>
                        <span>{PLACEHOLDER_DATA.header[fieldId]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column */}
                <div className="space-y-1 text-right">
                  {template.header.right.map(fieldId => {
                    const field = AVAILABLE_FIELDS.header.right.find(f => f.id === fieldId);
                    return (
                      <div key={fieldId} className="text-xs">
                        <span className="font-semibold">{field.label}: </span>
                        <span>{PLACEHOLDER_DATA.header[fieldId]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Line Items - Table Style */}
            <div className="border-b-2 border-black pb-3 mb-3">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="border-b border-black">
                    <th className={`px-2 py-1 text-left text-xs font-bold ${template.showTableBorders ? 'border border-black' : ''}`}>#</th>
                    <th className={`px-2 py-1 text-left text-xs font-bold ${template.showTableBorders ? 'border border-black' : ''}`} style={{ minWidth: '120px' }}>SKU</th>
                    {template.lineItems.filter(f => f !== 'sku').map(fieldId => {
                      const field = AVAILABLE_FIELDS.lineItems.find(f => f.id === fieldId);
                      return (
                        <th
                          key={fieldId}
                          className={`px-2 py-1 text-right text-xs font-bold ${template.showTableBorders ? 'border border-black' : ''}`}
                          style={{ minWidth: '50px' }}
                        >
                          {field.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PLACEHOLDER_DATA.lineItems.map((item, idx) => (
                    <tr key={idx} className={template.showTableBorders ? '' : 'border-b border-gray-300'}>
                      <td className={`px-2 py-2 text-xs align-top ${template.showTableBorders ? 'border border-black' : ''}`}>{idx + 1}.</td>
                      <td className={`px-2 py-2 text-xs align-top ${template.showTableBorders ? 'border border-black' : ''}`} style={{ wordWrap: 'break-word', maxWidth: '150px' }}>
                        <div className="font-medium">{item.sku}</div>
                        {template.showCtSize && item.ctSize && (
                          <div className="text-gray-600 italic mt-1">* Ct.Size ({item.ctSize})</div>
                        )}
                      </td>
                      {template.lineItems.filter(f => f !== 'sku').map(fieldId => {
                        const field = AVAILABLE_FIELDS.lineItems.find(f => f.id === fieldId);
                        const value = item[fieldId];
                        return (
                          <td
                            key={fieldId}
                            className={`px-2 py-2 text-xs text-right align-top ${template.showTableBorders ? 'border border-black' : ''}`}
                          >
                            {field.type === 'number' ? (
                              typeof value === 'number' ? value.toFixed(2) : '0.00'
                            ) : value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="border-b-2 border-black pb-3 mb-3">
              {template.summaryLayout === 'split' ? (
                // Split Layout: Summary on left, Sign area on right
                <div className="grid grid-cols-2 gap-8">
                  {/* Left: Summary */}
                  <div>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <tbody>
                        {template.summary.map(fieldId => {
                          const field = AVAILABLE_FIELDS.summary.find(f => f.id === fieldId);
                          const value = PLACEHOLDER_DATA.summary[fieldId];
                          return (
                            <tr key={fieldId} className="border-b border-gray-300">
                              <td className="py-1 pr-4 text-xs font-semibold">{field.label}</td>
                              <td className="py-1 text-xs text-right font-mono border-l border-gray-300 pl-4">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Sign & Stamp Area */}
                  <div className="flex flex-col justify-end">
                    <div className="text-right">
                      <div className="text-xs font-semibold mb-8">Sign & Stamp</div>
                      <div className="border-t border-black pt-1 text-xs text-gray-600">
                        printed on: {new Date().toISOString().split('T')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Full Width Layout: Summary only
                <div>
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      {template.summary.map(fieldId => {
                        const field = AVAILABLE_FIELDS.summary.find(f => f.id === fieldId);
                        const value = PLACEHOLDER_DATA.summary[fieldId];
                        return (
                          <tr key={fieldId} className="border-b border-gray-300">
                            <td className="py-1 pr-4 text-xs font-semibold">{field.label}</td>
                            <td className="py-1 text-xs text-right font-mono border-l border-gray-300 pl-4">
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4 text-right">
                    <div className="text-xs font-semibold mb-8">Sign & Stamp</div>
                    <div className="border-t border-black pt-1 text-xs text-gray-600 inline-block">
                      printed on: {new Date().toISOString().split('T')[0]}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Removed as sign & stamp is now in summary */}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceTemplateCreator;