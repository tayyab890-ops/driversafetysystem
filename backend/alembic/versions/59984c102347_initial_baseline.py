"""initial_baseline

Revision ID: 59984c102347
Revises: 
Create Date: 2026-11-23 23:39:29.198287

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '59984c102347'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='driver'),
        sa.Column('vehicle_id', sa.String(length=100), nullable=True),
        sa.Column('avatar', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 2. driving_sessions table
    op.create_table(
        'driving_sessions',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('driver_id', sa.String(length=50), nullable=False),
        sa.Column('vehicle', sa.String(length=100), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='active'),
        sa.Column('safety_score', sa.Integer(), nullable=True, server_default='100'),
        sa.Column('miles_monitored', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('alert_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('critical_alerts', sa.Integer(), nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['driver_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_driving_sessions_driver_id', 'driving_sessions', ['driver_id'], unique=False)

    # 3. refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'], unique=False)

    # 4. safety_alerts table
    op.create_table(
        'safety_alerts',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('session_id', sa.String(length=50), nullable=False),
        sa.Column('driver_id', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=True, server_default='medium'),
        sa.Column('confidence', sa.Float(), nullable=True, server_default='0.9'),
        sa.Column('acknowledged', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('ear_value', sa.Float(), nullable=True),
        sa.Column('yaw_angle', sa.Float(), nullable=True),
        sa.Column('pitch_angle', sa.Float(), nullable=True),
        sa.Column('object_class', sa.String(length=50), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['driver_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['driving_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_safety_alerts_driver_id', 'safety_alerts', ['driver_id'], unique=False)
    op.create_index('ix_safety_alerts_session_id', 'safety_alerts', ['session_id'], unique=False)
    op.create_index('ix_safety_alerts_timestamp', 'safety_alerts', ['timestamp'], unique=False)

    # 5. telemetry_records table
    op.create_table(
        'telemetry_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.String(length=50), nullable=False),
        sa.Column('fps', sa.Float(), nullable=True, server_default='60.0'),
        sa.Column('latency_ms', sa.Integer(), nullable=True, server_default='14'),
        sa.Column('face_detected', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.Column('face_confidence', sa.Float(), nullable=True, server_default='0.97'),
        sa.Column('ear', sa.Float(), nullable=True, server_default='0.285'),
        sa.Column('mar', sa.Float(), nullable=True, server_default='0.185'),
        sa.Column('head_yaw', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('head_pitch', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('head_roll', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('safety_score', sa.Integer(), nullable=True, server_default='100'),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['driving_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_telemetry_records_session_id', 'telemetry_records', ['session_id'], unique=False)


def downgrade() -> None:
    # Drop in reverse order of foreign key dependencies
    op.drop_index('ix_telemetry_records_session_id', table_name='telemetry_records')
    op.drop_table('telemetry_records')

    op.drop_index('ix_safety_alerts_timestamp', table_name='safety_alerts')
    op.drop_index('ix_safety_alerts_session_id', table_name='safety_alerts')
    op.drop_index('ix_safety_alerts_driver_id', table_name='safety_alerts')
    op.drop_table('safety_alerts')

    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_token_hash', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_index('ix_driving_sessions_driver_id', table_name='driving_sessions')
    op.drop_table('driving_sessions')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
