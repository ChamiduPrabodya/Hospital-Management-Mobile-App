import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getPatientHistoryApi } from '../../api/doctorApi';
import { getMedicalDocumentsApi, uploadMedicalDocumentApi } from '../../api/medicalDocumentApi';
import CustomInput from '../../components/CustomInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW, statusColor } from '../../theme';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const getDocumentMimeType = (asset, fallbackType = 'image/jpeg') => {
  const fileName = asset?.fileName || asset?.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (asset?.mimeType) return asset.mimeType;
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'png') return 'image/png';
  return fallbackType;
};

const AppointmentItem = ({ appointment }) => {
  const colors = statusColor(appointment.status);
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{appointment.serviceId?.serviceName || 'Service'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{appointment.status}</Text>
          </View>
        </View>
        <Text style={styles.itemMeta}>
          {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime || 'N/A'}
        </Text>
        {appointment.notes ? <Text style={styles.itemText}>{appointment.notes}</Text> : null}
        {appointment.medicalNote?.text ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Medical note</Text>
            <Text style={styles.noteText}>{appointment.medicalNote.text}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const DoctorPatientHistoryScreen = ({ route, navigation }) => {
  const patientId = route.params?.patientId;
  const [history, setHistory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Medical Report');
  const [docNotes, setDocNotes] = useState('');

  const loadHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await getPatientHistoryApi(patientId);
      setHistory(res.data?.data || res.data);
      const documentsRes = await getMedicalDocumentsApi(patientId);
      const documentData = Array.isArray(documentsRes.data) ? documentsRes.data : documentsRes.data?.data;
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const uploadSelectedDocument = async (asset, fallbackName, fallbackType) => {
    const title = docTitle.trim();
    const documentType = docType.trim();
    const uriParts = asset.uri.split('/');
    const fileName = asset.fileName || asset.name || uriParts[uriParts.length - 1] || fallbackName;
    const type = getDocumentMimeType(asset, fallbackType);
    const latestAppointment = appointments[0];

    const formData = new FormData();
    formData.append('patientId', patientId);
    if (latestAppointment?._id) formData.append('appointmentId', latestAppointment._id);
    formData.append('title', title);
    formData.append('documentType', documentType);
    formData.append('notes', docNotes.trim());
    formData.append(
      'medicalDocument',
      asset.file || {
        uri: asset.uri,
        name: fileName,
        type,
      }
    );

    setUploading(true);
    await uploadMedicalDocumentApi(formData);
    setDocTitle('');
    setDocNotes('');
    await loadHistory();
    Alert.alert('Uploaded', 'Medical document has been added to the patient history.');
  };

  const pickDocumentImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo access to choose a medical document.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    await uploadSelectedDocument(result.assets[0], `medical-document-${patientId}.jpg`, 'image/jpeg');
  };

  const pickDocumentPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    await uploadSelectedDocument(result.assets[0], `medical-document-${patientId}.pdf`, 'application/pdf');
  };

  const handleUploadDocument = () => {
    const title = docTitle.trim();
    const documentType = docType.trim();
    if (!title || !documentType) {
      Alert.alert('Missing Details', 'Please add a document title and type.');
      return;
    }

    Alert.alert('Upload Medical Document', 'Choose the file type to upload.', [
      { text: 'Image', onPress: () => pickAndUploadDocument(pickDocumentImage) },
      { text: 'PDF', onPress: () => pickAndUploadDocument(pickDocumentPdf) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickAndUploadDocument = async (picker) => {
    try {
      await picker();
    } catch (error) {
      Alert.alert('Upload Failed', error.response?.data?.message || error.message || 'Could not upload document');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !history) return <LoadingSpinner message="Loading patient history..." />;

  const patient = history?.patient || route.params?.patient || {};
  const appointments = history?.appointments || [];
  const medicalNotes = history?.medicalNotes || [];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Patient History"
        subtitle={patient.name || 'Past visits and notes'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.patientName}>{patient.name || 'Patient'}</Text>
          <Text style={styles.patientEmail}>{patient.email || 'No email address'}</Text>
          <View style={styles.divider} />
          <DetailRow label="Phone" value={patient.phone || 'No phone number'} />
          <DetailRow label="Address" value={patient.address || 'No address'} />
          <DetailRow label="Visits" value={`${history?.appointmentCount || 0}`} />
          <DetailRow label="Notes" value={`${history?.medicalNoteCount || 0}`} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <Text style={styles.sectionCount}>{medicalNotes.length}</Text>
        </View>
        {medicalNotes.length > 0 ? medicalNotes.map((note) => (
          <View key={`${note.appointmentId}-${note.updatedAt}`} style={styles.card}>
            <Text style={styles.noteDate}>{formatDate(note.appointmentDate)} | {note.serviceName}</Text>
            <Text style={styles.noteText}>{note.text}</Text>
            {note.updatedAt ? <Text style={styles.noteMeta}>Updated {formatDate(note.updatedAt)}</Text> : null}
          </View>
        )) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No medical notes have been added for this patient yet.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical Documents</Text>
          <Text style={styles.sectionCount}>{documents.length}</Text>
        </View>
        <View style={styles.card}>
          <CustomInput
            label="Document Title"
            value={docTitle}
            onChangeText={setDocTitle}
            placeholder="e.g. ECG report"
          />
          <CustomInput
            label="Document Type"
            value={docType}
            onChangeText={setDocType}
            placeholder="e.g. Lab Report"
          />
          <CustomInput
            label="Notes"
            value={docNotes}
            onChangeText={setDocNotes}
            placeholder="Short note about this document"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={handleUploadDocument}
            disabled={uploading}
            activeOpacity={0.85}
          >
            <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Upload Image or PDF'}</Text>
          </TouchableOpacity>
        </View>
        {documents.length > 0 ? documents.map((document) => (
          <TouchableOpacity
            key={document._id}
            style={styles.card}
            onPress={() => Linking.openURL(document.fileUrl)}
            activeOpacity={0.85}
          >
            <Text style={styles.noteDate}>{document.documentType} | {formatDate(document.createdAt)}</Text>
            <Text style={styles.documentTitle}>{document.title}</Text>
            {document.notes ? <Text style={styles.noteText}>{document.notes}</Text> : null}
            <Text style={styles.noteMeta}>Tap to open file</Text>
          </TouchableOpacity>
        )) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No medical documents have been uploaded for this patient yet.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visit Timeline</Text>
          <Text style={styles.sectionCount}>{appointments.length}</Text>
        </View>
        <View style={styles.timelineCard}>
          {appointments.map((appointment) => (
            <AppointmentItem key={appointment._id} appointment={appointment} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  content: { padding: 16, paddingBottom: 36 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.card,
  },
  patientName: { fontSize: 20, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  patientEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: FONTS.semibold },
  detailValue: {
    flex: 1,
    marginLeft: 16,
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  sectionCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: FONTS.bold },
  noteDate: { fontSize: 12, color: COLORS.tealStrong, fontWeight: FONTS.bold, marginBottom: 8 },
  noteText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  noteMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  documentTitle: { fontSize: 15, color: COLORS.navyDeep, fontWeight: FONTS.bold, marginBottom: 8 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  uploadBtn: {
    backgroundColor: COLORS.tealStrong,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  uploadBtnDisabled: { opacity: 0.7 },
  uploadBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 16,
    ...SHADOW.card,
  },
  timelineItem: { flexDirection: 'row', paddingBottom: 16 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.tealStrong,
    marginTop: 5,
    marginRight: 12,
  },
  timelineBody: { flex: 1 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { flex: 1, fontSize: 14, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  itemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  itemText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 19 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: FONTS.bold, textTransform: 'capitalize' },
  noteBox: { backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.md, padding: 12, marginTop: 10 },
  noteLabel: { fontSize: 10, color: COLORS.tealStrong, fontWeight: FONTS.bold, marginBottom: 5 },
});

export default DoctorPatientHistoryScreen;
