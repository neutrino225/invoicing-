import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Settings } from 'lucide-react';

const Navigation = () => {
	const location = useLocation();

	return (
		<nav
			style={{
				backgroundColor: 'white',
				borderBottom: '1px solid #e5e7eb',
				padding: '0.75rem 1rem',
				display: 'flex',
				gap: '0.5rem',
				alignItems: 'center',
			}}>
			<Link
				to="/invoice/generate"
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
					padding: '0.5rem 1rem',
					borderRadius: '0.25rem',
					textDecoration: 'none',
					color: location.pathname === '/invoice/generate' ? '#21b464' : '#6b7280',
					backgroundColor: location.pathname === '/invoice/generate' ? '#f0fdf4' : 'transparent',
					fontWeight: location.pathname === '/invoice/generate' ? 600 : 400,
					fontSize: '0.875rem',
					transition: 'all 0.2s ease',
				}}>
				<FileText size={18} />
				Generate Invoice
			</Link>
			<Link
				to="/invoice/template-editor"
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
					padding: '0.5rem 1rem',
					borderRadius: '0.25rem',
					textDecoration: 'none',
					color: location.pathname === '/invoice/template-editor' ? '#21b464' : '#6b7280',
					backgroundColor: location.pathname === '/invoice/template-editor' ? '#f0fdf4' : 'transparent',
					fontWeight: location.pathname === '/invoice/template-editor' ? 600 : 400,
					fontSize: '0.875rem',
					transition: 'all 0.2s ease',
				}}>
				<Settings size={18} />
				Template Editor
			</Link>
		</nav>
	);
};

export default Navigation;
