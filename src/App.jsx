import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import InvoiceTemplateCreator from './invoiceGenerator'
import InvoiceGenerator from './components/InvoiceGenerator'
import Navigation from './components/Navigation'

const App = () => {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Navigate to="/invoice/generate" replace />} />
        <Route path="/invoice/generate" element={<InvoiceGenerator />} />
        <Route path="/invoice/template-editor" element={<InvoiceTemplateCreator />} />
      </Routes>
    </>
  )
}

export default App