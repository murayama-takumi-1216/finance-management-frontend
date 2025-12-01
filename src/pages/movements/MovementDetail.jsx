import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { movementsAPI, documentsAPI } from '../../services/api';
import { useAccountsStore } from '../../store/useStore';

function MovementDetail() {
  const { accountId, movementId } = useParams();
  const navigate = useNavigate();
  const { currentAccount } = useAccountsStore();

  const [movement, setMovement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMovement();
  }, [accountId, movementId]);

  const loadMovement = async () => {
    setIsLoading(true);
    try {
      const { data } = await movementsAPI.getById(accountId, movementId);
      setMovement(data);
    } catch (error) {
      toast.error('Failed to load movement');
      navigate(`/accounts/${accountId}/movements`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const currency = currentAccount?.moneda || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append('file', files[0]);
        await documentsAPI.upload(accountId, movementId, formData);
      } else {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
        await documentsAPI.uploadMultiple(accountId, movementId, formData);
      }
      toast.success('File(s) uploaded successfully');
      loadMovement();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.delete(accountId, movementId, documentId);
      toast.success('Document deleted');
      loadMovement();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this movement?')) return;

    try {
      await movementsAPI.delete(accountId, movementId);
      toast.success('Movement deleted');
      navigate(`/accounts/${accountId}/movements`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete movement');
    }
  };

  const handleConfirm = async () => {
    try {
      await movementsAPI.confirm(accountId, movementId);
      toast.success('Movement confirmed');
      loadMovement();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to confirm movement');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="card animate-pulse">
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Movement not found</p>
        <Link to={`/accounts/${accountId}/movements`} className="btn-primary mt-4">
          Back to Movements
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/accounts/${accountId}/movements`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Movement Details</h1>
          <p className="text-gray-500">{formatDate(movement.fechaOperacion)}</p>
        </div>
        <div className="flex gap-2">
          {movement.estado === 'pendiente_revision' && (
            <button onClick={handleConfirm} className="btn-success">
              Confirm
            </button>
          )}
          <Link
            to={`/accounts/${accountId}/movements`}
            state={{ edit: movement.id }}
            className="btn-secondary"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger">
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <span
                className={`badge ${
                  movement.tipo === 'ingreso' ? 'badge-success' : 'badge-danger'
                }`}
              >
                {movement.tipo === 'ingreso' ? 'Income' : 'Expense'}
              </span>
              <span
                className={`badge ${
                  movement.estado === 'confirmado' ? 'badge-success' : 'badge-warning'
                }`}
              >
                {movement.estado === 'confirmado' ? 'Confirmed' : 'Pending Review'}
              </span>
            </div>

            <div className="text-center py-6 border-b">
              <p
                className={`text-4xl font-bold ${
                  movement.tipo === 'ingreso' ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {movement.tipo === 'ingreso' ? '+' : '-'}
                {formatCurrency(movement.importe)}
              </p>
              <p className="text-gray-500 mt-2">{movement.categoria?.nombre}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              {movement.proveedor && (
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">{movement.proveedor}</p>
                </div>
              )}
              {movement.descripcion && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{movement.descripcion}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Origin</p>
                <p className="font-medium capitalize">{movement.origen}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(movement.createdAt)}</p>
              </div>
            </div>

            {movement.notas && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-2">Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{movement.notas}</p>
              </div>
            )}

            {movement.etiquetas?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {movement.etiquetas.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Documents</h3>
            <label className="btn-secondary text-sm cursor-pointer">
              <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {movement.documentos?.length > 0 ? (
            <div className="space-y-3">
              {movement.documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DocumentIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.nombreArchivo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.tipoArchivo} &bull; {(doc.tamano / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1 text-danger-600 hover:bg-danger-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No documents attached</p>
              <p className="text-xs text-gray-400 mt-1">Upload receipts or invoices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovementDetail;
