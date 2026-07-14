import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { IdentityJwksService, LogiIdentityClaims } from '../auth/identity-jwks.service';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ChangeTicketPriorityDto } from './dto/change-ticket-priority.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketFromLogiflowDto } from './dto/create-ticket-from-logiflow.dto';
import { UpdateNotificationPreferenceDto } from './dto/notification-preference.dto';
import { ReprocessDeadLetterDto } from './dto/reprocess-dead-letter.dto';
import { CreateSupportCatalogDto, UpdateSupportCatalogDto } from './dto/support-catalog.dto';
import { TicketActionDto } from './dto/ticket-action.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller()
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly identityJwks: IdentityJwksService,
  ) {}

  @Get('tickets')
  listTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.ticketsService.listTickets({
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search ? { search } : {}),
    });
  }

  @Post('tickets')
  async createTicket(@Body() body: CreateTicketDto, @Headers('authorization') authorization: string | undefined) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.createTicket(body);
  }

  @Post('tickets/from-logiflow')
  createFromLogiflow(
    @Body() body: CreateTicketFromLogiflowDto,
    @Headers('x-service-token') serviceToken: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    this.assertServiceToken(serviceToken);
    return this.ticketsService.createFromLogiflow(body, idempotencyKey);
  }

  @Get('tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.ticketsService.getTicket(id);
  }

  @Get('tickets/:id/public')
  getPublicTicket(@Param('id') id: string) {
    return this.ticketsService.getPublicTicket(id);
  }

  @Patch('tickets/:id')
  async updateTicket(
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.updateTicket(id, body);
  }

  @Delete('tickets/:id')
  async archiveTicket(
    @Param('id') id: string,
    @Body() body: TicketActionDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.archiveTicket(id, { ...body, status: 'CANCELED' });
  }

  @Patch('tickets/:id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() body: ChangeTicketStatusDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.changeStatus(id, body);
  }

  @Patch('tickets/:id/priority')
  async changePriority(
    @Param('id') id: string,
    @Body() body: ChangeTicketPriorityDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.changePriority(id, body);
  }

  @Post('tickets/:id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR', 'CUSTOMER', 'DRIVER']);
    return this.ticketsService.createMessage(id, body);
  }

  @Post('tickets/:id/notes')
  async createLegacyNote(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.createNote(id, body);
  }

  @Get('tickets/:id/internal-notes')
  async listInternalNotes(@Param('id') id: string, @Headers('authorization') authorization: string | undefined) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.listInternalNotes(id);
  }

  @Post('tickets/:id/internal-notes')
  async createInternalNote(
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.createNote(id, body);
  }

  @Patch('tickets/:id/internal-notes/:noteId')
  async updateInternalNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() body: UpdateInternalNoteDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.updateInternalNote(id, noteId, body);
  }

  @Post('tickets/:id/assign')
  async assignTicket(
    @Param('id') id: string,
    @Body() body: AssignTicketDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.assignTicket(id, body);
  }

  @Delete('tickets/:id/assign')
  async unassignTicket(
    @Param('id') id: string,
    @Body() body: AssignTicketDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.unassignTicket(id, body);
  }

  @Post('tickets/:id/change-team')
  async changeTeam(
    @Param('id') id: string,
    @Body() body: AssignTicketDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR']);
    return this.ticketsService.changeTeam(id, body);
  }

  @Get('tickets/:id/assignments')
  listAssignments(@Param('id') id: string) {
    return this.ticketsService.listAssignments(id);
  }

  @Get('tickets/:id/attachments')
  listAttachments(@Param('id') id: string) {
    return this.ticketsService.listAttachments(id);
  }

  @Post('tickets/:id/attachments')
  async createAttachment(
    @Param('id') id: string,
    @Body() body: CreateAttachmentDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR', 'CUSTOMER', 'DRIVER']);
    return this.ticketsService.createAttachment(id, body);
  }

  @Get('notifications')
  listNotifications(
    @Query('userId') userId?: string,
    @Query('teamId') teamId?: string,
    @Query('unread') unread?: string,
  ) {
    return this.ticketsService.listNotifications({
      ...(userId ? { userId } : {}),
      ...(teamId ? { teamId } : {}),
      unread: unread === 'true',
    });
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string, @Headers('authorization') authorization: string | undefined) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT', 'OPERATOR', 'CUSTOMER', 'DRIVER']);
    return this.ticketsService.markNotificationRead(id);
  }

  @Get('notification-preferences/:userId')
  getNotificationPreferences(@Param('userId') userId: string) {
    return this.ticketsService.getNotificationPreferences(userId);
  }

  @Patch('notification-preferences/:userId')
  async updateNotificationPreferences(
    @Param('userId') userId: string,
    @Body() body: UpdateNotificationPreferenceDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestUserOrRole(authorization, userId, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.updateNotificationPreferences(userId, body);
  }

  @Get('reports/summary')
  getReportsSummary() {
    return this.ticketsService.getReportsSummary();
  }

  @Get('dead-letter-events')
  async listDeadLetterEvents(
    @Headers('x-service-token') serviceToken: string | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Query('correlationId') correlationId?: string,
  ) {
    await this.assertServiceTokenOrRole(serviceToken, authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.listDeadLetterEvents({
      ...(correlationId ? { correlationId } : {}),
    });
  }

  @Post('dead-letter-events/:id/reprocess')
  async reprocessDeadLetterEvent(
    @Param('id') id: string,
    @Body() body: ReprocessDeadLetterDto,
    @Headers('x-service-token') serviceToken: string | undefined,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertServiceTokenOrRole(serviceToken, authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.reprocessDeadLetterEvent(id, body);
  }

  @Get('teams')
  listTeams() {
    return this.ticketsService.listTeams();
  }

  @Post('teams')
  async createTeam(@Body() body: CreateSupportCatalogDto, @Headers('authorization') authorization: string | undefined) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.createTeam(body);
  }

  @Patch('teams/:id')
  async updateTeam(
    @Param('id') id: string,
    @Body() body: UpdateSupportCatalogDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.updateTeam(id, body);
  }

  @Delete('teams/:id')
  async deleteTeam(
    @Param('id') id: string,
    @Body() body: UpdateSupportCatalogDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.deleteTeam(id, body);
  }

  @Get('categories')
  listCategories() {
    return this.ticketsService.listCategories();
  }

  @Post('categories')
  async createCategory(@Body() body: CreateSupportCatalogDto, @Headers('authorization') authorization: string | undefined) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.createCategory(body);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateSupportCatalogDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @Param('id') id: string,
    @Body() body: UpdateSupportCatalogDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.deleteCategory(id, body);
  }

  @Get('tags')
  listTags() {
    return this.ticketsService.listTags();
  }

  @Post('tags')
  async createTag(@Body() body: CreateSupportCatalogDto, @Headers('authorization') authorization: string | undefined) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.createTag(body);
  }

  @Patch('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @Body() body: UpdateSupportCatalogDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.updateTag(id, body);
  }

  @Delete('tags/:id')
  async deleteTag(
    @Param('id') id: string,
    @Body() body: UpdateSupportCatalogDto,
    @Headers('authorization') authorization: string | undefined,
  ) {
    await this.assertRestRole(authorization, ['ADMIN', 'SUPPORT']);
    return this.ticketsService.deleteTag(id, body);
  }

  private assertServiceToken(serviceToken: string | undefined) {
    const expected = process.env.LOGIDESK_SERVICE_TOKEN;

    if (!expected || serviceToken !== expected) {
      throw new UnauthorizedException({ error: 'Invalid service token.' });
    }
  }

  private async assertServiceTokenOrRole(
    serviceToken: string | undefined,
    authorization: string | undefined,
    allowedRoles: string[],
  ) {
    const expected = process.env.LOGIDESK_SERVICE_TOKEN;

    if (expected && serviceToken === expected) {
      return;
    }

    const claims = await this.identityJwks.verifyAuthorizationHeader(authorization);
    const roles = claims.roles ?? [];

    if (!roles.some((role) => allowedRoles.includes(role))) {
      throw new ForbiddenException({ error: 'Role not allowed.' });
    }
  }

  private restAuthRequired() {
    return process.env.LOGIDESK_REQUIRE_REST_AUTH === 'true';
  }

  private async assertRestRole(
    authorization: string | undefined,
    allowedRoles: string[],
  ): Promise<LogiIdentityClaims | null> {
    if (!this.restAuthRequired()) {
      return null;
    }

    const claims = await this.identityJwks.verifyAuthorizationHeader(authorization);
    const roles = claims.roles ?? [];

    if (!roles.some((role) => allowedRoles.includes(role))) {
      throw new ForbiddenException({ error: 'Role not allowed.' });
    }

    return claims;
  }

  private async assertRestUserOrRole(
    authorization: string | undefined,
    userId: string,
    allowedRoles: string[],
  ) {
    const claims = await this.assertRestRole(authorization, [...allowedRoles, 'CUSTOMER', 'DRIVER', 'OPERATOR']);

    if (!claims || claims.sub === userId || claims.roles?.some((role) => allowedRoles.includes(role))) {
      return;
    }

    throw new ForbiddenException({ error: 'User does not own this resource.' });
  }
}
